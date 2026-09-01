import type { HttpClient } from "../transport/http-client.js";
import type { EventStreamClient } from "../transport/sse-client.js";
import type { ResolvedMCPxConfig } from "../config.js";
import { buildConsoleUrl } from "../utils/url.js";
import { TransactionRun } from "./transaction-run.js";
import type {
  TransactionSnapshot,
  TransactionListFilter,
  TransactionEvent,
  CompensationDecisionOptions,
} from "./types.js";

export class TransactionsClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly streamClient: EventStreamClient,
    private readonly config: ResolvedMCPxConfig
  ) {}

  /**
   * Retrieves a list of recent transactions from the MCPx runtime.
   */
  async list(filter?: TransactionListFilter): Promise<TransactionSnapshot[]> {
    const res = await this.httpClient.request<{ transactions: TransactionSnapshot[] }>({
      method: "GET",
      path: "/api/v1/transactions",
      query: {
        state: filter?.state,
        workflowId: filter?.workflowId,
        limit: filter?.limit,
        offset: filter?.offset,
      },
    });

    return (res.transactions || []).map((tx) => ({
      ...tx,
      consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, tx.id),
    }));
  }

  /**
   * Retrieves an existing transaction by ID and returns a rich TransactionRun handle.
   */
  async get(id: string): Promise<TransactionRun> {
    const res = await this.httpClient.request<{
      transaction: TransactionSnapshot;
      events?: TransactionEvent[];
    }>({
      method: "GET",
      path: `/api/v1/transactions/${encodeURIComponent(id)}`,
    });

    const snapshot: TransactionSnapshot = {
      ...res.transaction,
      consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, id),
    };

    return new TransactionRun(snapshot, this.httpClient, this.streamClient, this.config);
  }

  /**
   * Retrieves the raw list of events for a transaction.
   */
  async getEvents(id: string, afterSequence?: number): Promise<TransactionEvent[]> {
    const res = await this.httpClient.request<{ events: TransactionEvent[] }>({
      method: "GET",
      path: `/api/v1/transactions/${encodeURIComponent(id)}/events`,
      query: { afterSequence },
    });

    return res.events || [];
  }

  /**
   * Approves compensation rollback for a transaction requiring human/policy approval.
   */
  async approveCompensation(id: string, options?: CompensationDecisionOptions): Promise<TransactionSnapshot> {
    const run = await this.get(id);
    return run.approveCompensation(options);
  }

  /**
   * Rejects compensation rollback for a transaction.
   */
  async rejectCompensation(id: string, options?: CompensationDecisionOptions): Promise<TransactionSnapshot> {
    const run = await this.get(id);
    return run.rejectCompensation(options);
  }

  /**
   * Cancels a running transaction.
   */
  async cancel(id: string, reason?: string): Promise<TransactionSnapshot> {
    const run = await this.get(id);
    return run.cancel(reason);
  }
}
