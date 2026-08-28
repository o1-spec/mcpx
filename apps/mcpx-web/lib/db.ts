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
    // 1. Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        state VARCHAR(100) NOT NULL,
        scenario VARCHAR(255),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
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

    // 3. Transaction Events table (ordered by sequence)
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
      CREATE INDEX IF NOT EXISTS idx_tx_events_seq ON transaction_events (transaction_id, sequence ASC);
    `);

    isInitialized = true;
  } finally {
    client.release();
  }
}
