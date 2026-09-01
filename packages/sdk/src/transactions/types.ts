export type TransactionState =
  | "CREATED"
  | "PLANNING"
  | "ACTIVE"
  | "COMMITTED"
  | "AWAITING_COMPENSATION_APPROVAL"
  | "COMPENSATING"
  | "COMPENSATED"
  | "FAILED"
  | "ABORTED";

export type NodeState =
  | "PENDING"
  | "EXECUTING"
  | "SUCCEEDED"
  | "IN_DOUBT"
  | "RECONCILING"
  | "RECOVERED"
  | "FAILED"
  | "COMPENSATING"
  | "COMPENSATED";

export interface TransactionNodeSnapshot {
  id: string;
  service: string;
  label: string;
  origin?: string;
  executeTool?: string;
  inspectTool?: string;
  compensateTool?: string | null;
  state: NodeState;
  operationKey: string;
  resourceId?: string | null;
  dependencies: string[];
  executeArgs?: Record<string, unknown>;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionEvent {
  id: string;
  sequence: number;
  transactionId: string;
  nodeId?: string | null;
  nodeLabel?: string;
  type: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface TransactionSnapshot {
  id: string;
  state: TransactionState;
  scenario?: string | null;
  workflowId?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
  nodes: TransactionNodeSnapshot[];
  consoleUrl: string;
}

export interface TransactionListFilter {
  state?: TransactionState;
  workflowId?: string;
  limit?: number;
  offset?: number;
}

export interface CompensationDecisionOptions {
  reason?: string;
  decidedBy?: string;
}

export interface WaitOptions {
  timeoutMs?: number;
  pollingIntervalMs?: number;
  signal?: AbortSignal;
}

export type TerminalTransactionState = "COMMITTED" | "COMPENSATED" | "FAILED" | "ABORTED";

export interface CommittedWorkflowResult {
  transactionId: string;
  status: "COMMITTED";
  outputs: Record<string, unknown>;
  nodeStates: Record<string, NodeState>;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  consoleUrl: string;
}

export interface CompensatedWorkflowResult {
  transactionId: string;
  status: "COMPENSATED";
  failedNodeId?: string;
  compensatedNodes: string[];
  nodeStates: Record<string, NodeState>;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  consoleUrl: string;
  reason?: string;
}

export interface FailedWorkflowResult {
  transactionId: string;
  status: "FAILED" | "ABORTED";
  error: string;
  failedNodeId?: string;
  nodeStates: Record<string, NodeState>;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  consoleUrl: string;
}

export type WorkflowRunResult =
  | CommittedWorkflowResult
  | CompensatedWorkflowResult
  | FailedWorkflowResult;
