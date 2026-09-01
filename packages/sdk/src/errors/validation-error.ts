import { MCPxError, type MCPxErrorOptions } from "./mcpx-error.js";

export interface ValidationErrorDetail {
  field: string;
  message: string;
  rule?: string;
}

/**
 * Thrown when SDK client-side validation or server-side parameter schema validation fails.
 */
export class MCPxValidationError extends MCPxError {
  readonly validationErrors: ValidationErrorDetail[];

  constructor(message: string, errors: ValidationErrorDetail[] = [], options?: MCPxErrorOptions) {
    super(message, {
      ...options,
      code: "VALIDATION_ERROR",
      statusCode: 400,
    });
    this.name = "MCPxValidationError";
    this.validationErrors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
