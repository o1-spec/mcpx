import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://mcpx:mcpx@localhost:5435/mcpx_control";

const globalForWebDb = globalThis as unknown as {
  __mcpxWebDbPool?: Pool;
};

export const pool =
  globalForWebDb.__mcpxWebDbPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForWebDb.__mcpxWebDbPool = pool;
}

let isInitialized = false;

/**
 * Initializes the durable coordinator tables in Postgres
 */
export async function initCoordinatorDb(): Promise<void> {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    // 1. Transactions table with next_event_sequence column
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        state VARCHAR(100) NOT NULL,
        scenario VARCHAR(255),
        next_event_sequence INT NOT NULL DEFAULT 1,
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS next_event_sequence INT NOT NULL DEFAULT 1;
    `);

    // 2. Transaction Nodes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_nodes (
        id VARCHAR(255) NOT NULL,
        transaction_id VARCHAR(255) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        service VARCHAR(100) NOT NULL,
        label VARCHAR(255) NOT NULL,
        origin VARCHAR(255) NOT NULL,
        execute_tool VARCHAR(255) NOT NULL,
        inspect_tool VARCHAR(255) NOT NULL,
        compensate_tool VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        operation_key VARCHAR(255) NOT NULL,
        resource_id VARCHAR(255),
        dependencies JSONB NOT NULL DEFAULT '[]',
        execute_args JSONB NOT NULL DEFAULT '{}',
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (transaction_id, id)
      );
    `);

    // 3. Transaction Events table with UNIQUE (transaction_id, sequence)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_events (
        id VARCHAR(255) PRIMARY KEY,
        transaction_id VARCHAR(255) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        sequence INT NOT NULL,
        node_id VARCHAR(255),
        event_type VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      -- Ensure unique constraint exists
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_tx_event_seq'
        ) THEN
          ALTER TABLE transaction_events ADD CONSTRAINT uq_tx_event_seq UNIQUE (transaction_id, sequence);
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_tx_events_seq ON transaction_events (transaction_id, sequence ASC);
    `);

    isInitialized = true;
  } finally {
    client.release();
  }
}

export interface AtomicTransitionParams {
  transactionId: string;
  nodeId?: string;
  nodeState?: string;
  resourceId?: string;
  lastError?: string;
  executeArgs?: Record<string, unknown>;
  txState?: string;
  eventType: string;
  eventPayload?: Record<string, unknown>;
}

export interface AtomicTransitionResult {
  success: boolean;
  node?: unknown;
  transaction?: unknown;
  event: {
    id: string;
    sequence: number;
    nodeId: string | null;
    type: string;
    details: Record<string, unknown>;
    timestamp: string;
  };
}

/**
 * Atomically executes a state transition (node and/or transaction) and logs the event
 * inside a single PostgreSQL transaction with row-level locking for concurrency safety.
 */
export async function executeAtomicTransition(
  params: AtomicTransitionParams
): Promise<AtomicTransitionResult> {
  await initCoordinatorDb();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Row-level lock on the transaction row to serialize sequence allocation
    const lockRes = await client.query(
      `SELECT next_event_sequence, state FROM transactions WHERE id = $1 FOR UPDATE`,
      [params.transactionId]
    );

    if (lockRes.rows.length === 0) {
      throw new Error(`Transaction ${params.transactionId} not found`);
    }

    const assignedSeq = lockRes.rows[0].next_event_sequence;

    // 2. Update transaction_nodes if node state is changing
    let updatedNode: unknown = undefined;
    if (params.nodeId && params.nodeState) {
      const nodeRes = await client.query(
        `UPDATE transaction_nodes
         SET state = COALESCE($1, state),
             resource_id = COALESCE($2, resource_id),
             last_error = $3,
             execute_args = COALESCE($4, execute_args),
             updated_at = NOW()
         WHERE transaction_id = $5 AND id = $6
         RETURNING *`,
        [
          params.nodeState,
          params.resourceId ?? null,
          params.lastError ?? null,
          params.executeArgs ? JSON.stringify(params.executeArgs) : null,
          params.transactionId,
          params.nodeId,
        ]
      );
      if (nodeRes.rows.length > 0) {
        updatedNode = nodeRes.rows[0];
      }
    }

    // 3. Update transactions (state + advance next_event_sequence)
    let updatedTx: unknown = undefined;
    if (params.txState) {
      const txRes = await client.query(
        `UPDATE transactions
         SET state = $1,
             last_error = $2,
             next_event_sequence = next_event_sequence + 1,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [params.txState, params.lastError ?? null, params.transactionId]
      );
      updatedTx = txRes.rows[0];
    } else {
      const txRes = await client.query(
        `UPDATE transactions
         SET next_event_sequence = next_event_sequence + 1,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [params.transactionId]
      );
      updatedTx = txRes.rows[0];
    }

    // 4. Insert sequenced event (protected by UNIQUE constraint)
    const eventId = crypto.randomUUID();
    const eventRes = await client.query(
      `INSERT INTO transaction_events (id, transaction_id, sequence, node_id, event_type, payload, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, sequence, node_id, event_type, payload, occurred_at`,
      [
        eventId,
        params.transactionId,
        assignedSeq,
        params.nodeId || null,
        params.eventType,
        JSON.stringify(params.eventPayload || {}),
      ]
    );

    await client.query("COMMIT");

    const row = eventRes.rows[0];
    return {
      success: true,
      node: updatedNode,
      transaction: updatedTx,
      event: {
        id: row.id,
        sequence: row.sequence,
        nodeId: row.node_id,
        type: row.event_type,
        details: typeof row.payload === "object" ? row.payload : JSON.parse(row.payload || "{}"),
        timestamp: row.occurred_at.toISOString(),
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
