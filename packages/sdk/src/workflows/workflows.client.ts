import type { HttpClient } from "../transport/http-client.js";
import type { EventStreamClient } from "../transport/sse-client.js";
import type { ResolvedMCPxConfig } from "../config.js";
import { buildConsoleUrl } from "../utils/url.js";
import { WorkflowRun } from "./workflow-run.js";
import type { TransactionSnapshot } from "../transactions/types.js";
import type {
  WorkflowDefinition,
  WorkflowSummary,
  CreateWorkflowInput,
  RunWorkflowOptions,
} from "./types.js";

export class WorkflowsClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly streamClient: EventStreamClient,
    private readonly config: ResolvedMCPxConfig
  ) {}

  /**
   * Lists all workflow definitions configured in the MCPx registry.
   */
  async list(): Promise<WorkflowSummary[]> {
    const res = await this.httpClient.request<{ workflows: WorkflowSummary[] }>({
      method: "GET",
      path: "/api/v1/workflows",
    });

    return res.workflows || [];
  }

  /**
   * Retrieves a single workflow definition by ID or slug.
   */
  async get(id: string): Promise<WorkflowDefinition> {
    const res = await this.httpClient.request<{ workflow: WorkflowDefinition }>({
      method: "GET",
      path: `/api/v1/workflows/${encodeURIComponent(id)}`,
    });

    return res.workflow;
  }

  /**
   * Creates a new DAG workflow definition in the MCPx registry.
   */
  async create(input: CreateWorkflowInput): Promise<WorkflowDefinition> {
    const res = await this.httpClient.request<{ workflow: WorkflowDefinition }>({
      method: "POST",
      path: "/api/v1/workflows",
      body: input,
    });

    return res.workflow;
  }

  /**
   * Deletes a workflow definition.
   */
  async delete(id: string): Promise<boolean> {
    const res = await this.httpClient.request<{ success: boolean }>({
      method: "DELETE",
      path: `/api/v1/workflows/${encodeURIComponent(id)}`,
    });

    return Boolean(res.success);
  }

  /**
   * Starts a new durable execution of a workflow with the provided runtime input.
   * Returns an active WorkflowRun handle to stream events, check progress, and wait for completion.
   */
  async run(
    idOrSlug: string,
    input: Record<string, unknown> = {},
    options: RunWorkflowOptions = {}
  ): Promise<WorkflowRun> {
    const res = await this.httpClient.request<{
      transaction: TransactionSnapshot;
      workflow: WorkflowDefinition;
    }>({
      method: "POST",
      path: `/api/v1/workflows/${encodeURIComponent(idOrSlug)}/runs`,
      body: { input },
      idempotencyKey: options.idempotencyKey,
      signal: options.signal,
    });

    const snapshot: TransactionSnapshot = {
      ...res.transaction,
      consoleUrl: buildConsoleUrl(this.config.consoleBaseUrl, res.transaction.id),
    };

    return new WorkflowRun(snapshot, this.httpClient, this.streamClient, this.config);
  }
}
