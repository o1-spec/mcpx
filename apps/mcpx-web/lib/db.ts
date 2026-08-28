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
 * Initializes the durable coordinator, connected services, reliability contracts, and workflows tables in Postgres
 */
export async function initCoordinatorDb(): Promise<void> {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    // 1. Transactions table with next_event_sequence and workflow_id columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        state VARCHAR(100) NOT NULL,
        scenario VARCHAR(255),
        next_event_sequence INT NOT NULL DEFAULT 1,
        workflow_id VARCHAR(255),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS next_event_sequence INT NOT NULL DEFAULT 1;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS workflow_id VARCHAR(255);
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

    // 4. Connected Services Table (Milestone 2 - Service Registry)
    await client.query(`
      CREATE TABLE IF NOT EXISTS connected_services (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        origin VARCHAR(255) UNIQUE NOT NULL,
        last_discovered_tools JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_discovered_at TIMESTAMPTZ
      );
    `);

    // 5. Reliability Contracts Table (Milestone 3 - Contract Mapping)
    await client.query(`
      CREATE TABLE IF NOT EXISTS reliability_contracts (
        id VARCHAR(255) PRIMARY KEY,
        service_id VARCHAR(255) NOT NULL REFERENCES connected_services(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        execute_tool_name VARCHAR(255) NOT NULL,
        inspect_tool_name VARCHAR(255) NOT NULL,
        compensate_tool_name VARCHAR(255),
        operation_key_field VARCHAR(255) NOT NULL DEFAULT 'operationKey',
        assertions JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(50) NOT NULL DEFAULT 'READY',
        execute_schema_snapshot JSONB,
        inspect_schema_snapshot JSONB,
        compensate_schema_snapshot JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_contracts_service_id ON reliability_contracts(service_id);
    `);

    // 6. Workflows and Workflow Nodes Tables (Milestone 4 - Custom Workflows)
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workflow_nodes (
        id VARCHAR(255) PRIMARY KEY,
        workflow_id VARCHAR(255) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        step_key VARCHAR(255) NOT NULL,
        label VARCHAR(255) NOT NULL,
        contract_id VARCHAR(255) NOT NULL REFERENCES reliability_contracts(id) ON DELETE CASCADE,
        dependencies JSONB NOT NULL DEFAULT '[]',
        input_config JSONB NOT NULL DEFAULT '{}',
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(workflow_id, step_key)
      );
      CREATE INDEX IF NOT EXISTS idx_wf_nodes_workflow_id ON workflow_nodes(workflow_id);
    `);

    isInitialized = true;
  } finally {
    client.release();
  }
}

export interface ConnectedServiceRecord {
  id: string;
  name: string;
  origin: string;
  lastDiscoveredTools: Array<{
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
  }>;
  createdAt: string;
  updatedAt: string;
  lastDiscoveredAt?: string | null;
}

export interface ReliabilityContractRecord {
  id: string;
  serviceId: string;
  name: string;
  executeToolName: string;
  inspectToolName: string;
  compensateToolName: string | null;
  operationKeyField: string;
  assertions: {
    executeIdempotent?: boolean;
    inspectAuthoritative?: boolean;
    compensateRetrySafe?: boolean;
  };
  status: "READY" | "NEEDS_REVIEW" | "INVALID";
  executeSchemaSnapshot?: Record<string, unknown> | null;
  inspectSchemaSnapshot?: Record<string, unknown> | null;
  compensateSchemaSnapshot?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNodeRecord {
  id: string;
  workflowId: string;
  stepKey: string;
  label: string;
  contractId: string;
  dependencies: string[];
  inputConfig: Record<string, { type: "static" | "dependency_output"; value?: unknown; stepId?: string; field?: string }>;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRecord {
  id: string;
  name: string;
  description: string | null;
  nodes: WorkflowNodeRecord[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Lists all user-connected services from Postgres
 */
export async function listConnectedServices(): Promise<ConnectedServiceRecord[]> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, name, origin, last_discovered_tools, created_at, updated_at, last_discovered_at 
       FROM connected_services 
       ORDER BY created_at DESC`
    );
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      origin: row.origin,
      lastDiscoveredTools: typeof row.last_discovered_tools === "string"
        ? JSON.parse(row.last_discovered_tools)
        : row.last_discovered_tools || [],
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      lastDiscoveredAt: row.last_discovered_at ? row.last_discovered_at.toISOString() : null,
    }));
  } finally {
    client.release();
  }
}

/**
 * Gets a single connected service by ID
 */
export async function getConnectedService(id: string): Promise<ConnectedServiceRecord | null> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, name, origin, last_discovered_tools, created_at, updated_at, last_discovered_at 
       FROM connected_services 
       WHERE id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      origin: row.origin,
      lastDiscoveredTools: typeof row.last_discovered_tools === "string"
        ? JSON.parse(row.last_discovered_tools)
        : row.last_discovered_tools || [],
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      lastDiscoveredAt: row.last_discovered_at ? row.last_discovered_at.toISOString() : null,
    };
  } finally {
    client.release();
  }
}

/**
 * Creates or registers a new connected service
 */
export async function createConnectedService(params: {
  name: string;
  origin: string;
  tools?: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>;
}): Promise<ConnectedServiceRecord> {
  await initCoordinatorDb();
  const client = await pool.connect();
  const id = `srv_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = new Date();

  try {
    const res = await client.query(
      `INSERT INTO connected_services (id, name, origin, last_discovered_tools, created_at, updated_at, last_discovered_at)
       VALUES ($1, $2, $3, $4, $5, $5, $5)
       RETURNING id, name, origin, last_discovered_tools, created_at, updated_at, last_discovered_at`,
      [
        id,
        params.name,
        params.origin,
        JSON.stringify(params.tools || []),
        now,
      ]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      origin: row.origin,
      lastDiscoveredTools: params.tools || [],
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      lastDiscoveredAt: row.last_discovered_at.toISOString(),
    };
  } finally {
    client.release();
  }
}

/**
 * Updates a connected service's discovered tools snapshot and checks contracts for staleness
 */
export async function updateConnectedServiceTools(
  id: string,
  tools: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>
): Promise<void> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE connected_services 
       SET last_discovered_tools = $1, 
           last_discovered_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $2`,
      [JSON.stringify(tools), id]
    );

    // Stale contract check for this service
    const contractsRes = await client.query(
      `SELECT id, execute_tool_name, inspect_tool_name, compensate_tool_name, operation_key_field, status 
       FROM reliability_contracts 
       WHERE service_id = $1`,
      [id]
    );

    for (const contract of contractsRes.rows) {
      const execTool = tools.find((t) => t.name === contract.execute_tool_name);
      const inspTool = tools.find((t) => t.name === contract.inspect_tool_name);
      const compTool = contract.compensate_tool_name
        ? tools.find((t) => t.name === contract.compensate_tool_name)
        : true;

      const hasExec = !!execTool;
      const hasInsp = !!inspTool;
      const hasComp = !!compTool;

      const opKey = contract.operation_key_field;
      const execHasKey = execTool?.inputSchema?.properties
        ? opKey in (execTool.inputSchema.properties as Record<string, unknown>)
        : true;
      const inspHasKey = inspTool?.inputSchema?.properties
        ? opKey in (inspTool.inputSchema.properties as Record<string, unknown>)
        : true;

      if (!hasExec || !hasInsp || !hasComp || !execHasKey || !inspHasKey) {
        await client.query(
          `UPDATE reliability_contracts SET status = 'NEEDS_REVIEW', updated_at = NOW() WHERE id = $1`,
          [contract.id]
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Deletes a connected service from the MCPx registry
 */
export async function deleteConnectedService(id: string): Promise<boolean> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const res = await client.query(`DELETE FROM connected_services WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

/**
 * Lists all reliability contracts for a service
 */
export async function listContractsForService(serviceId: string): Promise<ReliabilityContractRecord[]> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, service_id, name, execute_tool_name, inspect_tool_name, compensate_tool_name, 
              operation_key_field, assertions, status, execute_schema_snapshot, inspect_schema_snapshot, 
              compensate_schema_snapshot, created_at, updated_at 
       FROM reliability_contracts 
       WHERE service_id = $1 
       ORDER BY created_at ASC`,
      [serviceId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      serviceId: row.service_id,
      name: row.name,
      executeToolName: row.execute_tool_name,
      inspectToolName: row.inspect_tool_name,
      compensateToolName: row.compensate_tool_name,
      operationKeyField: row.operation_key_field,
      assertions: typeof row.assertions === "string" ? JSON.parse(row.assertions) : row.assertions || {},
      status: row.status,
      executeSchemaSnapshot: typeof row.execute_schema_snapshot === "string" ? JSON.parse(row.execute_schema_snapshot) : row.execute_schema_snapshot,
      inspectSchemaSnapshot: typeof row.inspect_schema_snapshot === "string" ? JSON.parse(row.inspect_schema_snapshot) : row.inspect_schema_snapshot,
      compensateSchemaSnapshot: typeof row.compensate_schema_snapshot === "string" ? JSON.parse(row.compensate_schema_snapshot) : row.compensate_schema_snapshot,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
  } finally {
    client.release();
  }
}

/**
 * Gets a single reliability contract by ID
 */
export async function getContract(contractId: string): Promise<ReliabilityContractRecord | null> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, service_id, name, execute_tool_name, inspect_tool_name, compensate_tool_name, 
              operation_key_field, assertions, status, execute_schema_snapshot, inspect_schema_snapshot, 
              compensate_schema_snapshot, created_at, updated_at 
       FROM reliability_contracts 
       WHERE id = $1`,
      [contractId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      serviceId: row.service_id,
      name: row.name,
      executeToolName: row.execute_tool_name,
      inspectToolName: row.inspect_tool_name,
      compensateToolName: row.compensate_tool_name,
      operationKeyField: row.operation_key_field,
      assertions: typeof row.assertions === "string" ? JSON.parse(row.assertions) : row.assertions || {},
      status: row.status,
      executeSchemaSnapshot: typeof row.execute_schema_snapshot === "string" ? JSON.parse(row.execute_schema_snapshot) : row.execute_schema_snapshot,
      inspectSchemaSnapshot: typeof row.inspect_schema_snapshot === "string" ? JSON.parse(row.inspect_schema_snapshot) : row.inspect_schema_snapshot,
      compensateSchemaSnapshot: typeof row.compensate_schema_snapshot === "string" ? JSON.parse(row.compensate_schema_snapshot) : row.compensate_schema_snapshot,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  } finally {
    client.release();
  }
}

/**
 * Creates a new reliability contract in PostgreSQL
 */
export async function createReliabilityContract(params: {
  serviceId: string;
  name: string;
  executeToolName: string;
  inspectToolName: string;
  compensateToolName?: string | null;
  operationKeyField: string;
  assertions: {
    executeIdempotent?: boolean;
    inspectAuthoritative?: boolean;
    compensateRetrySafe?: boolean;
  };
  status: "READY" | "NEEDS_REVIEW" | "INVALID";
  executeSchemaSnapshot?: Record<string, unknown> | null;
  inspectSchemaSnapshot?: Record<string, unknown> | null;
  compensateSchemaSnapshot?: Record<string, unknown> | null;
}): Promise<ReliabilityContractRecord> {
  await initCoordinatorDb();
  const client = await pool.connect();
  const id = `ctr_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = new Date();

  try {
    const res = await client.query(
      `INSERT INTO reliability_contracts (
        id, service_id, name, execute_tool_name, inspect_tool_name, compensate_tool_name,
        operation_key_field, assertions, status, execute_schema_snapshot, inspect_schema_snapshot,
        compensate_schema_snapshot, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
      RETURNING *`,
      [
        id,
        params.serviceId,
        params.name,
        params.executeToolName,
        params.inspectToolName,
        params.compensateToolName || null,
        params.operationKeyField || "operationKey",
        JSON.stringify(params.assertions || {}),
        params.status || "READY",
        params.executeSchemaSnapshot ? JSON.stringify(params.executeSchemaSnapshot) : null,
        params.inspectSchemaSnapshot ? JSON.stringify(params.inspectSchemaSnapshot) : null,
        params.compensateSchemaSnapshot ? JSON.stringify(params.compensateSchemaSnapshot) : null,
        now,
      ]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      serviceId: row.service_id,
      name: row.name,
      executeToolName: row.execute_tool_name,
      inspectToolName: row.inspect_tool_name,
      compensateToolName: row.compensate_tool_name,
      operationKeyField: row.operation_key_field,
      assertions: typeof row.assertions === "string" ? JSON.parse(row.assertions) : row.assertions || {},
      status: row.status,
      executeSchemaSnapshot: params.executeSchemaSnapshot || null,
      inspectSchemaSnapshot: params.inspectSchemaSnapshot || null,
      compensateSchemaSnapshot: params.compensateSchemaSnapshot || null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  } finally {
    client.release();
  }
}

/**
 * Deletes a reliability contract
 */
export async function deleteReliabilityContract(contractId: string): Promise<boolean> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const res = await client.query(`DELETE FROM reliability_contracts WHERE id = $1`, [contractId]);
    return (res.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

// -----------------------------------------------------------------------------
// WORKFLOWS & WORKFLOW NODES (Milestone 4 - Custom Workflows)
// -----------------------------------------------------------------------------

/**
 * Lists all custom workflows with their nodes
 */
export async function listWorkflows(): Promise<WorkflowRecord[]> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const wfRes = await client.query(
      `SELECT id, name, description, created_at, updated_at FROM workflows ORDER BY created_at DESC`
    );
    const workflows: WorkflowRecord[] = [];

    for (const row of wfRes.rows) {
      const nodesRes = await client.query(
        `SELECT id, workflow_id, step_key, label, contract_id, dependencies, input_config, position, created_at, updated_at
         FROM workflow_nodes
         WHERE workflow_id = $1
         ORDER BY position ASC`,
        [row.id]
      );
      workflows.push({
        id: row.id,
        name: row.name,
        description: row.description,
        nodes: nodesRes.rows.map((n) => ({
          id: n.id,
          workflowId: n.workflow_id,
          stepKey: n.step_key,
          label: n.label,
          contractId: n.contract_id,
          dependencies: typeof n.dependencies === "string" ? JSON.parse(n.dependencies) : n.dependencies || [],
          inputConfig: typeof n.input_config === "string" ? JSON.parse(n.input_config) : n.input_config || {},
          position: n.position,
          createdAt: n.created_at.toISOString(),
          updatedAt: n.updated_at.toISOString(),
        })),
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      });
    }

    return workflows;
  } finally {
    client.release();
  }
}

/**
 * Gets a single workflow by ID with its nodes
 */
export async function getWorkflow(id: string): Promise<WorkflowRecord | null> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const wfRes = await client.query(
      `SELECT id, name, description, created_at, updated_at FROM workflows WHERE id = $1`,
      [id]
    );
    if (wfRes.rows.length === 0) return null;
    const row = wfRes.rows[0];

    const nodesRes = await client.query(
      `SELECT id, workflow_id, step_key, label, contract_id, dependencies, input_config, position, created_at, updated_at
       FROM workflow_nodes
       WHERE workflow_id = $1
       ORDER BY position ASC`,
      [id]
    );

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      nodes: nodesRes.rows.map((n) => ({
        id: n.id,
        workflowId: n.workflow_id,
        stepKey: n.step_key,
        label: n.label,
        contractId: n.contract_id,
        dependencies: typeof n.dependencies === "string" ? JSON.parse(n.dependencies) : n.dependencies || [],
        inputConfig: typeof n.input_config === "string" ? JSON.parse(n.input_config) : n.input_config || {},
        position: n.position,
        createdAt: n.created_at.toISOString(),
        updatedAt: n.updated_at.toISOString(),
      })),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  } finally {
    client.release();
  }
}

/**
 * Creates a new custom workflow and its nodes in a single PostgreSQL transaction
 */
export async function createWorkflow(params: {
  name: string;
  description?: string;
  nodes: Array<{
    stepKey: string;
    label: string;
    contractId: string;
    dependencies: string[];
    inputConfig?: Record<string, { type: "static" | "dependency_output"; value?: unknown; stepId?: string; field?: string }>;
    position: number;
  }>;
}): Promise<WorkflowRecord> {
  await initCoordinatorDb();
  const client = await pool.connect();
  const wfId = `wf_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = new Date();

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO workflows (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)`,
      [wfId, params.name, params.description || null, now]
    );

    const createdNodes: WorkflowNodeRecord[] = [];
    for (const n of params.nodes) {
      const nodeId = `wfn_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const nodeRes = await client.query(
        `INSERT INTO workflow_nodes (id, workflow_id, step_key, label, contract_id, dependencies, input_config, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
         RETURNING *`,
        [
          nodeId,
          wfId,
          n.stepKey,
          n.label,
          n.contractId,
          JSON.stringify(n.dependencies || []),
          JSON.stringify(n.inputConfig || {}),
          n.position,
          now,
        ]
      );
      const row = nodeRes.rows[0];
      createdNodes.push({
        id: row.id,
        workflowId: row.workflow_id,
        stepKey: row.step_key,
        label: row.label,
        contractId: row.contract_id,
        dependencies: typeof row.dependencies === "string" ? JSON.parse(row.dependencies) : row.dependencies || [],
        inputConfig: typeof row.input_config === "string" ? JSON.parse(row.input_config) : row.input_config || {},
        position: row.position,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      });
    }

    await client.query("COMMIT");

    return {
      id: wfId,
      name: params.name,
      description: params.description || null,
      nodes: createdNodes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Deletes a workflow and all its nodes
 */
export async function deleteWorkflow(id: string): Promise<boolean> {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const res = await client.query(`DELETE FROM workflows WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

/**
 * Lists recent transactions for a workflow
 */
export async function listTransactionsForWorkflow(workflowId: string) {
  await initCoordinatorDb();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, state, scenario, workflow_id, created_at, updated_at 
       FROM transactions 
       WHERE workflow_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [workflowId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      state: row.state,
      scenario: row.scenario,
      workflowId: row.workflow_id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
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
