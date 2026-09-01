import type { HttpClient } from "../transport/http-client.js";
import type { ReliabilityContract, CreateContractInput } from "./types.js";

export class ContractsClient {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Lists all reliability contracts registered in MCPx.
   */
  async list(): Promise<ReliabilityContract[]> {
    const res = await this.httpClient.request<{ contracts: ReliabilityContract[] }>({
      method: "GET",
      path: "/api/v1/contracts",
    });

    return res.contracts || [];
  }

  /**
   * Retrieves a single reliability contract by ID.
   */
  async get(id: string): Promise<ReliabilityContract> {
    const res = await this.httpClient.request<{ contract: ReliabilityContract }>({
      method: "GET",
      path: `/api/v1/contracts/${encodeURIComponent(id)}`,
    });

    return res.contract;
  }

  /**
   * Creates a new reliability contract binding execute, inspect, and compensate WebMCP tools.
   */
  async create(input: CreateContractInput): Promise<ReliabilityContract> {
    const res = await this.httpClient.request<{ contract: ReliabilityContract }>({
      method: "POST",
      path: "/api/v1/contracts",
      body: input,
    });

    return res.contract;
  }

  /**
   * Deletes a reliability contract.
   */
  async delete(id: string): Promise<boolean> {
    const res = await this.httpClient.request<{ success: boolean }>({
      method: "DELETE",
      path: `/api/v1/contracts/${encodeURIComponent(id)}`,
    });

    return Boolean(res.success);
  }
}
