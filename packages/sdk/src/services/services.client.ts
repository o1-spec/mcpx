import type { HttpClient } from "../transport/http-client.js";
import type {
  ServiceDefinition,
  ConnectServiceInput,
} from "./types.js";

export class ServicesClient {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Lists all connected WebMCP services registered in MCPx.
   */
  async list(): Promise<ServiceDefinition[]> {
    const res = await this.httpClient.request<{ services: ServiceDefinition[] }>({
      method: "GET",
      path: "/api/v1/services",
    });

    return res.services || [];
  }

  /**
   * Retrieves a single registered WebMCP service by ID.
   */
  async get(id: string): Promise<ServiceDefinition> {
    const res = await this.httpClient.request<{ service: ServiceDefinition }>({
      method: "GET",
      path: `/api/v1/services/${encodeURIComponent(id)}`,
    });

    return res.service;
  }

  /**
   * Connects / registers a WebMCP service origin with MCPx.
   *
   * Note: WebMCP tool discovery across cross-origin iframe boundaries runs in the browser context
   * or via registered tool definitions.
   */
  async connect(input: ConnectServiceInput): Promise<ServiceDefinition> {
    const res = await this.httpClient.request<{ service: ServiceDefinition }>({
      method: "POST",
      path: "/api/v1/services",
      body: input,
    });

    return res.service;
  }

  /**
   * Unregisters / removes a connected service.
   */
  async delete(id: string): Promise<boolean> {
    const res = await this.httpClient.request<{ success: boolean }>({
      method: "DELETE",
      path: `/api/v1/services/${encodeURIComponent(id)}`,
    });

    return Boolean(res.success);
  }
}
