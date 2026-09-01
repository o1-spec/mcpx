export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface MCPxConfig {
  /**
   * Base endpoint URL of the MCPx runtime coordinator (e.g. "http://localhost:3000" or "https://mcpx.internal.company.com").
   */
  endpoint: string;

  /**
   * Optional API key for authenticating with the MCPx runtime control plane.
   */
  apiKey?: string;

  /**
   * Optional custom base URL for the MCPx Console UI if hosted separately from the API endpoint.
   * If omitted, derived directly from `endpoint`.
   */
  consoleBaseUrl?: string;

  /**
   * Default timeout in milliseconds for API requests (default: 30000ms).
   */
  timeoutMs?: number;

  /**
   * Default polling interval in milliseconds when falling back to polling (default: 1000ms).
   */
  pollingIntervalMs?: number;

  /**
   * Optional custom fetch implementation (defaults to globalThis.fetch).
   */
  fetch?: typeof globalThis.fetch;

  /**
   * Optional default HTTP headers included on every outgoing request.
   */
  headers?: Record<string, string>;

  /**
   * Optional custom logger for SDK debug and diagnostic messages.
   */
  logger?: Logger;
}

export interface ResolvedMCPxConfig {
  endpoint: string;
  apiKey?: string;
  consoleBaseUrl: string;
  timeoutMs: number;
  pollingIntervalMs: number;
  fetch: typeof globalThis.fetch;
  headers: Record<string, string>;
  logger?: Logger;
}

export function resolveConfig(config: MCPxConfig): ResolvedMCPxConfig {
  if (!config.endpoint) {
    throw new Error("MCPx SDK configuration requires an 'endpoint' URL (e.g. 'http://localhost:3000')");
  }

  const endpoint = config.endpoint.replace(/\/+$/, "");
  const consoleBaseUrl = config.consoleBaseUrl
    ? config.consoleBaseUrl.replace(/\/+$/, "")
    : endpoint;

  return {
    endpoint,
    apiKey: config.apiKey,
    consoleBaseUrl,
    timeoutMs: config.timeoutMs ?? 30_000,
    pollingIntervalMs: config.pollingIntervalMs ?? 1_000,
    fetch: config.fetch ?? globalThis.fetch.bind(globalThis),
    headers: config.headers ?? {},
    logger: config.logger,
  };
}
