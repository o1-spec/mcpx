import type { ResolvedMCPxConfig } from "../config.js";
import { buildUrl } from "../utils/url.js";
import { createTimeoutSignal } from "../utils/abort.js";
import {
  MCPxApiError,
  MCPxAuthenticationError,
  MCPxNotFoundError,
  MCPxConflictError,
  MCPxValidationError,
  MCPxConnectionError,
} from "../errors/index.js";
import type { RequestOptions } from "./types.js";

export class HttpClient {
  constructor(private readonly config: ResolvedMCPxConfig) {}

  async request<T>(options: RequestOptions): Promise<T> {
    const method = options.method ?? "GET";
    const url = buildUrl(this.config.endpoint, options.path, options.query);
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;
    const { signal, cleanup } = createTimeoutSignal(timeoutMs, options.signal);

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...this.config.headers,
      ...options.headers,
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
      headers["X-MCPx-API-Key"] = this.config.apiKey;
    }

    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    let bodyString: string | undefined;
    if (options.body !== undefined && options.body !== null) {
      headers["Content-Type"] = "application/json";
      bodyString = JSON.stringify(options.body);
    }

    this.config.logger?.debug?.(`[MCPx-SDK] ${method} ${url}`, {
      headers: Object.keys(headers),
      hasBody: Boolean(bodyString),
    });

    try {
      const response = await this.config.fetch(url, {
        method,
        headers,
        body: bodyString,
        signal,
      });

      const contentType = response.headers.get("content-type") || "";
      let parsedBody: unknown;

      if (contentType.includes("application/json")) {
        try {
          parsedBody = await response.json();
        } catch {
          parsedBody = null;
        }
      } else {
        parsedBody = await response.text();
      }

      if (!response.ok) {
        this.handleHttpError(response.status, url, parsedBody);
      }

      return parsedBody as T;
    } catch (err: unknown) {
      if (
        err instanceof MCPxApiError ||
        err instanceof MCPxValidationError ||
        err instanceof MCPxAuthenticationError ||
        err instanceof MCPxNotFoundError ||
        err instanceof MCPxConflictError
      ) {
        throw err;
      }

      if (signal.aborted && signal.reason) {
        throw signal.reason;
      }

      throw new MCPxConnectionError(`Failed to connect to MCPx runtime at ${url}: ${(err as Error).message}`, {
        url,
        cause: err,
      });
    } finally {
      cleanup();
    }
  }

  private handleHttpError(status: number, url: string, body: unknown): never {
    const errorObject = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
    const message =
      (typeof errorObject.error === "string" ? errorObject.error : null) ||
      (typeof errorObject.message === "string" ? errorObject.message : null) ||
      `HTTP ${status} from MCPx runtime`;

    if (status === 401 || status === 403) {
      throw new MCPxAuthenticationError(message, {
        status,
        url,
        responseBody: body,
      });
    }

    if (status === 404) {
      throw new MCPxNotFoundError(message, {
        url,
        responseBody: body,
      });
    }

    if (status === 409) {
      throw new MCPxConflictError(message, {
        status,
        url,
        responseBody: body,
      });
    }

    if (status === 400) {
      const details = Array.isArray(errorObject.details) ? (errorObject.details as any[]) : [];
      throw new MCPxValidationError(message, details, {
        statusCode: 400,
        details: body,
      });
    }

    throw new MCPxApiError(message, {
      status,
      url,
      responseBody: body,
    });
  }
}
