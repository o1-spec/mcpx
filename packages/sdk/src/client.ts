import { type MCPxConfig, type ResolvedMCPxConfig, resolveConfig } from "./config.js";
import { HttpClient } from "./transport/http-client.js";
import { EventStreamClient } from "./transport/sse-client.js";
import { WorkflowsClient } from "./workflows/workflows.client.js";
import { TransactionsClient } from "./transactions/transactions.client.js";
import { ServicesClient } from "./services/services.client.js";
import { ContractsClient } from "./contracts/contracts.client.js";
import { ApprovalsClient } from "./approvals/approvals.client.js";

export const SDK_VERSION = "0.1.0";

export interface ServerInfo {
  name: string;
  version: string;
  apiVersion: string;
  capabilities: {
    durableTransactions: boolean;
    eventStreaming: boolean;
    compensationApproval: boolean;
    workflowManagement: boolean;
    serviceRegistration: boolean;
  };
}

export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  database: boolean;
  timestamp: string;
}

/**
 * Main client for interacting with the MCPx reliable workflow orchestration runtime.
 */
export class MCPx {
  static readonly SDK_VERSION = SDK_VERSION;

  readonly config: ResolvedMCPxConfig;

  readonly workflows: WorkflowsClient;
  readonly transactions: TransactionsClient;
  readonly services: ServicesClient;
  readonly contracts: ContractsClient;
  readonly approvals: ApprovalsClient;

  private readonly httpClient: HttpClient;
  private readonly streamClient: EventStreamClient;

  constructor(config: MCPxConfig) {
    this.config = resolveConfig(config);
    this.httpClient = new HttpClient(this.config);
    this.streamClient = new EventStreamClient(this.config);

    this.workflows = new WorkflowsClient(this.httpClient, this.streamClient, this.config);
    this.transactions = new TransactionsClient(this.httpClient, this.streamClient, this.config);
    this.services = new ServicesClient(this.httpClient);
    this.contracts = new ContractsClient(this.httpClient);
    this.approvals = new ApprovalsClient(this.httpClient, this.config);
  }

  /**
   * Retrieves runtime metadata, version, and supported capabilities.
   */
  async getServerInfo(): Promise<ServerInfo> {
    return this.httpClient.request<ServerInfo>({
      method: "GET",
      path: "/api/v1/system/info",
    });
  }

  /**
   * Performs a health check against the MCPx runtime coordinator.
   */
  async health(): Promise<HealthStatus> {
    return this.httpClient.request<HealthStatus>({
      method: "GET",
      path: "/api/health",
    });
  }
}
