import type { TransactionSnapshot } from "../transactions/types.js";

export interface PendingCompensationApproval {
  transactionId: string;
  workflowName?: string;
  scenario?: string;
  failedNodeId?: string;
  failedNodeLabel?: string;
  compensableNodes: {
    id: string;
    label: string;
    service: string;
    resourceId?: string | null;
    compensateTool?: string | null;
  }[];
  consoleUrl: string;
  requestedAt: string;
}

export interface ApprovalDecisionInput {
  reason?: string;
  decidedBy?: string;
}

export interface ApprovalDecisionResult {
  success: boolean;
  transaction: TransactionSnapshot;
}
