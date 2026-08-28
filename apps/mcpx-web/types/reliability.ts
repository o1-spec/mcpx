export type {
  NodeState,
  TransactionState,
  TransactionNode,
  Transaction as TransactionModel,
  ServiceContract,
  ExecutionResult,
  ReconciliationResult,
  CompensationResult,
} from "@/lib/transaction";

export interface TransactionEvent {
  id: string;
  sequence?: number;
  nodeId?: string;
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
    schemaName?: string;
    name: string;
    operationKey: string;
    createdAt: string;
  };
}
