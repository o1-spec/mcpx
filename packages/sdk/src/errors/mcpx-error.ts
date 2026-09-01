export interface MCPxErrorOptions extends ErrorOptions {
  code?: string;
  transactionId?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Base class for all errors thrown by the @mcpxx/sdk client.
 *
 * Provides typed error codes and metadata to assist applications
 * in implementing deterministic retry and fallback policies.
 */
export class MCPxError extends Error {
  readonly code: string;
  readonly transactionId?: string;
  readonly statusCode?: number;
  readonly details?: unknown;

  constructor(message: string, options?: MCPxErrorOptions) {
    super(message, options);
    this.name = "MCPxError";
    this.code = options?.code ?? "MCPX_ERROR";
    this.transactionId = options?.transactionId;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
