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

export type TransactionState =
  | "CREATED"
  | "EXECUTING"
  | "COMMITTED"
  | "ABORTING"
  | "AWAITING_COMPENSATION_APPROVAL"
  | "COMPENSATING"
  | "COMPENSATED"
  | "FAILED";

export interface TransactionNode {
  id: string; // e.g. "routing:create" | "database:create"
  label?: string;
  state: NodeState;
  operationKey: string;
  resourceId?: string;
  lastError?: string;
}

export interface TransactionModel {
  id: string;
  state: TransactionState;
  nodes: TransactionNode[];
  lastError?: string;
}

export interface TransactionEvent {
  id: string;
  type: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface DiscoveredToolInfo {
  name: string;
  origin?: string;
  description?: string;
}

export interface AuthoritativeState {
  inspected: boolean;
  exists?: boolean;
  route?: {
    id: string;
    projectName: string;
    targetUrl: string;
    operationKey: string;
    createdAt: string;
  };
  database?: {
    id: string;
    name: string;
    operationKey: string;
    createdAt: string;
  };
}
