export type NodeState =
  | "PENDING"
  | "EXECUTING"
  | "SUCCEEDED"
  | "IN_DOUBT"
  | "RECONCILING"
  | "RECOVERED"
  | "FAILED";

export interface TransactionNode {
  id: "routing:create";
  state: NodeState;
  operationKey: string;
  resourceId?: string;
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
}
