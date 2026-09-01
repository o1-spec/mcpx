export interface WorkflowNodeDefinition {
  id: string;
  label: string;
  contractId: string;
  dependencies?: string[];
  inputBindings?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string | null;
  nodes: WorkflowNodeDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string | null;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowInput {
  id?: string;
  name: string;
  description?: string;
  nodes: WorkflowNodeDefinition[];
}

export interface RunWorkflowOptions {
  /**
   * Optional custom idempotency key to prevent accidental duplicate workflow initialization.
   */
  idempotencyKey?: string;

  /**
   * Optional timeout for waiting in milliseconds.
   */
  timeoutMs?: number;

  /**
   * Optional abort signal.
   */
  signal?: AbortSignal;
}
