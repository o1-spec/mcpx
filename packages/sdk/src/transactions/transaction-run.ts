import type { HttpClient } from "../transport/http-client.js";
import type { EventStreamClient } from "../transport/sse-client.js";
import type { ResolvedMCPxConfig } from "../config.js";
import { buildConsoleUrl } from "../utils/url.js";
import { pollUntil } from "../utils/polling.js";
import { MCPxTimeoutError } from "../errors/timeout-error.js";
import type {
  TransactionSnapshot,
  TransactionState,
  TransactionEvent,
  TransactionNodeSnapshot,
  WorkflowRunResult,
  WaitOptions,
  CompensationDecisionOptions,
} from "./types.js";

type EventCallback = (event: TransactionEvent) => void;
type StateCallback = (state: TransactionState, snapshot: TransactionSnapshot) => void;

export class TransactionRun {
  readonly id: string;
  readonly consoleUrl: string;

  private _snapshot: TransactionSnapshot;
  private readonly eventListeners: Set<EventCallback> = new Set();
  private readonly stateListeners: Set<StateCallback> = new Set();
  private isStreaming = false;

  constructor(
    snapshot: TransactionSnapshot,
    private readonly httpClient: HttpClient,
    private readonly streamClient: EventStreamClient,
    private readonly config: ResolvedMCPxConfig
  ) {
    this.id = snapshot.id;
    this._snapshot = snapshot;
    this.consoleUrl = snapshot.consoleUrl || buildConsoleUrl(this.config.consoleBaseUrl, this.id);
  }

  get status(): TransactionState {
    return this._snapshot.state;
  }

  get state(): TransactionState {
    return this._snapshot.state;
  }

  get workflowId(): string | null | undefined {
    return this._snapshot.workflowId;
  }

  get scenario(): string | null | undefined {
    return this._snapshot.scenario;
  }

  get startedAt(): string {
    return this._snapshot.createdAt;
  }

  get updatedAt(): string {
    return this._snapshot.updatedAt;
  }

  get nodes(): TransactionNodeSnapshot[] {
    return this._snapshot.nodes;
  }

  get snapshot(): TransactionSnapshot {
    return this._snapshot;
  }

  getNode(nodeId: string): TransactionNodeSnapshot | undefined {
    return this._snapshot.nodes.find((n) => n.id === nodeId);
  }

  /**
   * Refreshes the transaction snapshot from the MCPx runtime.
   */
  async refresh(): Promise<TransactionSnapshot> {
    const res = await this.httpClient.request<{
      transaction: TransactionSnapshot;
      events?: TransactionEvent[];
    }>({
      method: "GET",
      path: `/api/v1/transactions/${encodeURIComponent(this.id)}`,
    });

    const previousState = this._snapshot.state;
    this._snapshot = {
      ...res.transaction,
      consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, this.id),
    };

    if (previousState !== this._snapshot.state) {
      for (const listener of this.stateListeners) {
        try {
          listener(this._snapshot.state, this._snapshot);
        } catch {
          // ignore callback error
        }
      }
    }

    return this._snapshot;
  }

  /**
   * Waits for the transaction to reach a terminal state (COMMITTED, COMPENSATED, FAILED, ABORTED).
   */
  async wait(options: WaitOptions = {}): Promise<WorkflowRunResult> {
    const timeoutMs = options.timeoutMs ?? 120_000;
    const pollingIntervalMs = options.pollingIntervalMs ?? this.config.pollingIntervalMs;

    const terminalStates: TransactionState[] = [
      "COMMITTED",
      "COMPENSATED",
      "FAILED",
      "ABORTED",
    ];

    if (terminalStates.includes(this._snapshot.state)) {
      return this.buildResult(this._snapshot);
    }

    try {
      const finalSnapshot = await pollUntil<TransactionSnapshot>(
        async () => {
          const fresh = await this.refresh();
          if (terminalStates.includes(fresh.state)) {
            return fresh;
          }
          return null;
        },
        {
          timeoutMs,
          intervalMs: pollingIntervalMs,
          signal: options.signal,
        }
      );

      return this.buildResult(finalSnapshot);
    } catch (err: unknown) {
      if (err instanceof MCPxTimeoutError) {
        throw new MCPxTimeoutError(
          `Transaction '${this.id}' did not complete within ${timeoutMs}ms (current state: ${this._snapshot.state})`,
          timeoutMs,
          { transactionId: this.id }
        );
      }
      throw err;
    }
  }

  /**
   * Subscribes to live transaction events via Server-Sent Events or polling.
   */
  async *events(options?: { signal?: AbortSignal }): AsyncGenerator<TransactionEvent, void, unknown> {
    const seenSequences = new Set<number>();
    let lastSeq = 0;

    // 1. Fetch initial stored events first
    try {
      const initial = await this.httpClient.request<{ events: TransactionEvent[] }>({
        method: "GET",
        path: `/api/v1/transactions/${encodeURIComponent(this.id)}/events`,
        signal: options?.signal,
      });

      if (Array.isArray(initial.events)) {
        for (const ev of initial.events) {
          if (!seenSequences.has(ev.sequence)) {
            seenSequences.add(ev.sequence);
            lastSeq = Math.max(lastSeq, ev.sequence);
            yield ev;
          }
        }
      }
    } catch {
      // Fall through to streaming
    }

    const terminalStates: TransactionState[] = [
      "COMMITTED",
      "COMPENSATED",
      "FAILED",
      "ABORTED",
    ];

    if (terminalStates.includes(this._snapshot.state)) {
      return;
    }

    // 2. Stream live events
    try {
      for await (const streamEv of this.streamClient.streamEvents({
        path: `/api/v1/transactions/${encodeURIComponent(this.id)}/events`,
        query: { afterSequence: lastSeq },
        signal: options?.signal,
        lastEventId: lastSeq > 0 ? String(lastSeq) : undefined,
      })) {
        try {
          const parsed = JSON.parse(streamEv.data) as TransactionEvent;
          if (parsed && typeof parsed.sequence === "number" && !seenSequences.has(parsed.sequence)) {
            seenSequences.add(parsed.sequence);
            lastSeq = Math.max(lastSeq, parsed.sequence);
            yield parsed;

            if (
              parsed.type === "TRANSACTION_COMMITTED" ||
              parsed.type === "TRANSACTION_COMPENSATED" ||
              parsed.type === "TRANSACTION_FAILED" ||
              parsed.type === "TRANSACTION_ABORTED"
            ) {
              break;
            }
          }
        } catch {
          // Ignore malformed event payload
        }
      }
    } catch {
      // Fall back to polling if SSE is disconnected
      while (!terminalStates.includes(this._snapshot.state)) {
        if (options?.signal?.aborted) break;
        await new Promise((r) => setTimeout(r, 1000));
        await this.refresh();

        const polled = await this.httpClient.request<{ events: TransactionEvent[] }>({
          method: "GET",
          path: `/api/v1/transactions/${encodeURIComponent(this.id)}/events`,
          query: { afterSequence: lastSeq },
          signal: options?.signal,
        });

        for (const ev of polled.events || []) {
          if (!seenSequences.has(ev.sequence)) {
            seenSequences.add(ev.sequence);
            lastSeq = Math.max(lastSeq, ev.sequence);
            yield ev;
          }
        }
      }
    }
  }

  /**
   * Register a callback for incoming transaction events.
   */
  on(event: "event", callback: EventCallback): () => void;
  on(event: "state", callback: StateCallback): () => void;
  on(event: "event" | "state", callback: any): () => void {
    if (event === "event") {
      this.eventListeners.add(callback);
      this.ensureBackgroundStreaming();
      return () => this.eventListeners.delete(callback);
    }
    if (event === "state") {
      this.stateListeners.add(callback);
      return () => this.stateListeners.delete(callback);
    }
    return () => {};
  }

  /**
   * Unregister an event listener.
   */
  off(event: "event" | "state", callback: any): void {
    if (event === "event") this.eventListeners.delete(callback);
    if (event === "state") this.stateListeners.delete(callback);
  }

  private ensureBackgroundStreaming(): void {
    if (this.isStreaming) return;
    this.isStreaming = true;

    (async () => {
      try {
        for await (const ev of this.events()) {
          for (const listener of this.eventListeners) {
            try {
              listener(ev);
            } catch {
              // ignore
            }
          }
        }
      } finally {
        this.isStreaming = false;
      }
    })();
  }

  /**
   * Approves compensation rollback when transaction is in AWAITING_COMPENSATION_APPROVAL state.
   */
  async approveCompensation(options?: CompensationDecisionOptions): Promise<TransactionSnapshot> {
    const res = await this.httpClient.request<{
      success: boolean;
      transaction: TransactionSnapshot;
    }>({
      method: "POST",
      path: `/api/v1/transactions/${encodeURIComponent(this.id)}/compensation/approve`,
      body: options ?? {},
    });

    this._snapshot = {
      ...res.transaction,
      consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, this.id),
    };
    return this._snapshot;
  }

  /**
   * Rejects compensation rollback when transaction is in AWAITING_COMPENSATION_APPROVAL state.
   */
  async rejectCompensation(options?: CompensationDecisionOptions): Promise<TransactionSnapshot> {
    const res = await this.httpClient.request<{
      success: boolean;
      transaction: TransactionSnapshot;
    }>({
      method: "POST",
      path: `/api/v1/transactions/${encodeURIComponent(this.id)}/compensation/reject`,
      body: options ?? {},
    });

    this._snapshot = {
      ...res.transaction,
      consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, this.id),
    };
    return this._snapshot;
  }

  /**
   * Cancels the active transaction.
   */
  async cancel(reason?: string): Promise<TransactionSnapshot> {
    const res = await this.httpClient.request<{
      success: boolean;
      transaction: TransactionSnapshot;
    }>({
      method: "POST",
      path: `/api/v1/transactions/${encodeURIComponent(this.id)}/cancel`,
      body: { reason },
    });

    this._snapshot = {
      ...res.transaction,
      consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, this.id),
    };
    return this._snapshot;
  }

  private buildResult(snapshot: TransactionSnapshot): WorkflowRunResult {
    const nodeStates: Record<string, any> = {};
    const outputs: Record<string, unknown> = {};
    let failedNodeId: string | undefined;
    const compensatedNodes: string[] = [];

    for (const node of snapshot.nodes) {
      nodeStates[node.id] = node.state;
      if (node.resourceId) {
        outputs[node.id] = { resourceId: node.resourceId, ...(node.executeArgs || {}) };
      }
      if (node.state === "FAILED" && !failedNodeId) {
        failedNodeId = node.id;
      }
      if (node.state === "COMPENSATED") {
        compensatedNodes.push(node.id);
      }
    }

    const startTime = new Date(snapshot.createdAt).getTime();
    const endTime = new Date(snapshot.updatedAt).getTime();
    const durationMs = Math.max(0, endTime - startTime);

    if (snapshot.state === "COMMITTED") {
      return {
        transactionId: snapshot.id,
        status: "COMMITTED",
        outputs,
        nodeStates,
        startedAt: snapshot.createdAt,
        completedAt: snapshot.updatedAt,
        durationMs,
        consoleUrl: snapshot.consoleUrl,
      };
    }

    if (snapshot.state === "COMPENSATED") {
      return {
        transactionId: snapshot.id,
        status: "COMPENSATED",
        failedNodeId,
        compensatedNodes,
        nodeStates,
        startedAt: snapshot.createdAt,
        completedAt: snapshot.updatedAt,
        durationMs,
        consoleUrl: snapshot.consoleUrl,
        reason: snapshot.lastError || undefined,
      };
    }

    return {
      transactionId: snapshot.id,
      status: snapshot.state === "ABORTED" ? "ABORTED" : "FAILED",
      error: snapshot.lastError || "Transaction did not complete successfully",
      failedNodeId,
      nodeStates,
      startedAt: snapshot.createdAt,
      completedAt: snapshot.updatedAt,
      durationMs,
      consoleUrl: snapshot.consoleUrl,
    };
  }
}
