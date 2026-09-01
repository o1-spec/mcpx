import { test } from "node:test";
import assert from "node:assert";
import { MCPx, SDK_VERSION } from "../src/index.js";
import { buildUrl, buildConsoleUrl } from "../src/utils/url.js";

test("MCPx client initialization and configuration", () => {
  const mcpx = new MCPx({
    endpoint: "http://localhost:3000",
    apiKey: "test_key_123",
    timeoutMs: 15000,
  });

  assert.strictEqual(MCPx.SDK_VERSION, SDK_VERSION);
  assert.strictEqual(mcpx.config.endpoint, "http://localhost:3000");
  assert.strictEqual(mcpx.config.apiKey, "test_key_123");
  assert.strictEqual(mcpx.config.timeoutMs, 15000);
  assert.strictEqual(mcpx.config.consoleBaseUrl, "http://localhost:3000");

  assert.ok(mcpx.workflows);
  assert.ok(mcpx.transactions);
  assert.ok(mcpx.services);
  assert.ok(mcpx.contracts);
  assert.ok(mcpx.approvals);
});

test("URL and Console link builders", () => {
  const url = buildUrl("http://localhost:3000/", "/api/v1/transactions", {
    state: "ACTIVE",
    limit: 10,
  });
  assert.strictEqual(url, "http://localhost:3000/api/v1/transactions?state=ACTIVE&limit=10");

  const consoleUrl = buildConsoleUrl("https://mcpx.company.com", "tx_test_42");
  assert.strictEqual(consoleUrl, "https://mcpx.company.com/app/transactions/tx_test_42");
});
