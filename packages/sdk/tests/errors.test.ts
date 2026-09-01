import { test } from "node:test";
import assert from "node:assert";
import {
  MCPxError,
  MCPxApiError,
  MCPxAuthenticationError,
  MCPxNotFoundError,
  MCPxConflictError,
  MCPxValidationError,
  MCPxTimeoutError,
  MCPxConnectionError,
} from "../src/errors/index.js";

test("MCPxError hierarchy and properties", () => {
  const err = new MCPxError("Generic failure", {
    code: "CUSTOM_CODE",
    transactionId: "tx_123",
    statusCode: 500,
  });

  assert.strictEqual(err.name, "MCPxError");
  assert.strictEqual(err.message, "Generic failure");
  assert.strictEqual(err.code, "CUSTOM_CODE");
  assert.strictEqual(err.transactionId, "tx_123");
  assert.strictEqual(err.statusCode, 500);
  assert.ok(err instanceof Error);
  assert.ok(err instanceof MCPxError);
});

test("MCPxApiError subclasses mapping", () => {
  const notFound = new MCPxNotFoundError("Workflow not found", {
    resourceType: "workflow",
    resourceId: "wf_99",
  });
  assert.strictEqual(notFound.status, 404);
  assert.strictEqual(notFound.code, "NOT_FOUND");
  assert.strictEqual(notFound.resourceId, "wf_99");
  assert.ok(notFound instanceof MCPxApiError);

  const authErr = new MCPxAuthenticationError("Invalid API Key");
  assert.strictEqual(authErr.status, 401);
  assert.strictEqual(authErr.code, "UNAUTHORIZED");

  const conflictErr = new MCPxConflictError("Service origin already exists");
  assert.strictEqual(conflictErr.status, 409);
  assert.strictEqual(conflictErr.code, "CONFLICT");

  const timeoutErr = new MCPxTimeoutError("Wait timeout", 5000, { transactionId: "tx_abc" });
  assert.strictEqual(timeoutErr.status, undefined);
  assert.strictEqual(timeoutErr.timeoutMs, 5000);
  assert.strictEqual(timeoutErr.transactionId, "tx_abc");

  const validationErr = new MCPxValidationError("Missing required name", [
    { field: "name", message: "Required" },
  ]);
  assert.strictEqual(validationErr.validationErrors.length, 1);
  assert.strictEqual(validationErr.validationErrors[0]?.field, "name");

  const connErr = new MCPxConnectionError("Network refused", { url: "http://localhost:3000" });
  assert.strictEqual(connErr.url, "http://localhost:3000");
});
