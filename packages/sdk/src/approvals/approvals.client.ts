import type { HttpClient } from "../transport/http-client.js";
import type { ResolvedMCPxConfig } from "../config.js";
import { buildConsoleUrl } from "../utils/url.js";
import type {
  PendingCompensationApproval,
  ApprovalDecisionInput,
  ApprovalDecisionResult,
} from "./types.js";
import type { TransactionSnapshot } from "../transactions/types.js";

export class ApprovalsClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: ResolvedMCPxConfig
  ) {}

  /**
   * Lists all transactions currently awaiting compensation approval from human operators or policy bots.
   */
  async listPending(): Promise<PendingCompensationApproval[]> {
    const res = await this.httpClient.request<{ approvals: PendingCompensationApproval[] }>({
      method: "GET",
      path: "/api/v1/transactions",
      query: { state: "AWAITING_COMPENSATION_APPROVAL" },
    });

    const transactions = (res as unknown as { transactions: TransactionSnapshot[] }).transactions || [];
    return transactions.map((tx) => ({
      transactionId: tx.id,
      workflowName: tx.scenario ?? undefined,
      scenario: tx.scenario ?? undefined,
      failedNodeId: tx.nodes.find((n) => n.state === "FAILED")?.id,
      failedNodeLabel: tx.nodes.find((n) => n.state === "FAILED")?.label,
      compensableNodes: tx.nodes
        .filter((n) => n.state === "SUCCEEDED" || n.state === "RECOVERED")
        .map((n) => ({
          id: n.id,
          label: n.label,
          service: n.service,
          resourceId: n.resourceId,
          compensateTool: n.compensateTool,
        })),
      consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, tx.id),
      requestedAt: tx.updatedAt,
    }));
  }

  /**
   * Programmatically approves reverse topological compensation for a transaction.
   */
  async approve(
    transactionId: string,
    decision?: ApprovalDecisionInput
  ): Promise<ApprovalDecisionResult> {
    const res = await this.httpClient.request<{
      success: boolean;
      transaction: TransactionSnapshot;
    }>({
      method: "POST",
      path: `/api/v1/transactions/${encodeURIComponent(transactionId)}/compensation/approve`,
      body: decision ?? {},
    });

    return {
      success: res.success,
      transaction: {
        ...res.transaction,
        consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, transactionId),
      },
    };
  }

  /**
   * Programmatically rejects compensation rollback for a transaction.
   */
  async reject(
    transactionId: string,
    decision?: ApprovalDecisionInput
  ): Promise<ApprovalDecisionResult> {
    const res = await this.httpClient.request<{
      success: boolean;
      transaction: TransactionSnapshot;
    }>({
      method: "POST",
      path: `/api/v1/transactions/${encodeURIComponent(transactionId)}/compensation/reject`,
      body: decision ?? {},
    });

    return {
      success: res.success,
      transaction: {
        ...res.transaction,
        consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, transactionId),
      },
    };
  }
}
