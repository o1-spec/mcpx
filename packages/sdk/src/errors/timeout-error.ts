import { MCPxError, type MCPxErrorOptions } from "./mcpx-error.js";

/**
 * Thrown when an asynchronous wait or network request exceeds the configured timeout threshold.
 */
export class MCPxTimeoutError extends MCPxError {
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number, options?: MCPxErrorOptions) {
    super(message, {
      ...options,
      code: "TIMEOUT",
      statusCode: 408,
    });
    this.name = "MCPxTimeoutError";
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
