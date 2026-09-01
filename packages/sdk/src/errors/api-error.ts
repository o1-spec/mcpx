import { MCPxError, type MCPxErrorOptions } from "./mcpx-error.js";

export interface MCPxApiErrorOptions extends MCPxErrorOptions {
  status: number;
  url?: string;
  responseBody?: unknown;
}

/**
 * Thrown when the MCPx API returns a non-2xx HTTP status code.
 */
export class MCPxApiError extends MCPxError {
  readonly status: number;
  readonly url?: string;
  readonly responseBody?: unknown;

  constructor(message: string, options: MCPxApiErrorOptions) {
    super(message, {
      ...options,
      code: options.code ?? `HTTP_${options.status}`,
      statusCode: options.status,
    });
    this.name = "MCPxApiError";
    this.status = options.status;
    this.url = options.url;
    this.responseBody = options.responseBody;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an endpoint requires authentication or the provided API key is invalid (401/403).
 */
export class MCPxAuthenticationError extends MCPxApiError {
  constructor(message = "Authentication failed with MCPx runtime", options?: Partial<MCPxApiErrorOptions>) {
    super(message, {
      status: options?.status ?? 401,
      code: options?.code ?? "UNAUTHORIZED",
      ...options,
    });
    this.name = "MCPxAuthenticationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a requested resource (workflow, transaction, service, contract) is not found (404).
 */
export class MCPxNotFoundError extends MCPxApiError {
  readonly resourceType?: string;
  readonly resourceId?: string;

  constructor(
    message: string,
    options?: Partial<MCPxApiErrorOptions> & { resourceType?: string; resourceId?: string }
  ) {
    super(message, {
      status: 404,
      code: "NOT_FOUND",
      ...options,
    });
    this.name = "MCPxNotFoundError";
    this.resourceType = options?.resourceType;
    this.resourceId = options?.resourceId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an operation conflicts with current state (409).
 */
export class MCPxConflictError extends MCPxApiError {
  constructor(message: string, options?: Partial<MCPxApiErrorOptions>) {
    super(message, {
      status: 409,
      code: "CONFLICT",
      ...options,
    });
    this.name = "MCPxConflictError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when network transport fails to connect to the MCPx runtime.
 */
export class MCPxConnectionError extends MCPxError {
  readonly url?: string;

  constructor(message: string, options?: MCPxErrorOptions & { url?: string }) {
    super(message, {
      ...options,
      code: options?.code ?? "CONNECTION_FAILED",
    });
    this.name = "MCPxConnectionError";
    this.url = options?.url;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
