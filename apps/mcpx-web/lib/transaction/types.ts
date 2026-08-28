export type NodeState =
  | "PENDING"
  | "EXECUTING"
  | "SUCCEEDED"
  | "IN_DOUBT"
  | "RECONCILING"
  | "RECOVERED"
  | "FAILED"
  | "COMPENSATING"
  | "COMPENSATED"
  | "MANUAL_ATTENTION_REQUIRED"
  | "SKIPPED";

export type TransactionState =
  | "CREATED"
  | "EXECUTING"
  | "COMMITTED"
  | "ABORTING"
  | "AWAITING_COMPENSATION_APPROVAL"
  | "COMPENSATING"
  | "COMPENSATED"
  | "MANUAL_ATTENTION_REQUIRED"
  | "FAILED";

export interface TransactionNode {
  id: string; // Unique node ID in DAG, e.g. "database:create", "routing:create"
  label: string;

  service: string; // Service name registered in contracts, e.g. "database", "routing"
  origin: string; // Expected provider origin, e.g. "http://localhost:3002"

  executeTool: string; // e.g. "create_database"
  inspectTool: string; // e.g. "get_database"
  compensateTool: string; // e.g. "delete_database"

  operationKey: string;

  dependencies: string[]; // Array of node IDs that must reach SUCCEEDED or RECOVERED

  state: NodeState;

  resourceId?: string;
  lastError?: string;

  executeArgs: Record<string, unknown>;
}

export interface Transaction {
  id: string;
  state: TransactionState;
  nodes: TransactionNode[];
  lastError?: string;
}

export interface ServiceContract {
  service: string;
  origin: string;
  executeTool: string;
  inspectTool: string;
  compensateTool: string;
  extractResourceId?: (data: unknown) => string | undefined;
}

export type ExecutionOutcome = "SUCCEEDED" | "IN_DOUBT" | "FAILED";

export interface ExecutionResult {
  outcome: ExecutionOutcome;
  updatedNode: TransactionNode;
  rawResult?: unknown;
  normalizedResult?: unknown;
  error?: string;
  resourceId?: string;
}

export type ReconciliationOutcome = "RECOVERED" | "ABSENT" | "UNINTERPRETABLE";

export interface ReconciliationResult {
  outcome: ReconciliationOutcome;
  updatedNode: TransactionNode;
  rawResult?: unknown;
  normalizedResult?: unknown;
  resource?: unknown;
  resourceId?: string;
  error?: string;
}

export type CompensationOutcome = "COMPENSATED" | "FAILED";

export interface CompensationResult {
  outcome: CompensationOutcome;
  updatedNode: TransactionNode;
  error?: string;
}
