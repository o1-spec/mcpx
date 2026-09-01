import { test } from "node:test";
import assert from "node:assert";
import { MCPx } from "../src/index.js";

test("Transactions client inspection and wait completion", async () => {
  let pollCount = 0;

  const mockFetch = async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes("/api/v1/transactions/tx_test_wait")) {
      pollCount++;
      const state = pollCount < 2 ? "ACTIVE" : "COMMITTED";
      return new Response(
        JSON.stringify({
          transaction: {
            id: "tx_test_wait",
            state,
            scenario: "Test Pipeline",
            createdAt: "2026-09-01T00:00:00Z",
            updatedAt: "2026-09-01T00:00:05Z",
            nodes: [
              {
                id: "step_1",
                service: "Widget",
                label: "Create Widget",
                state: pollCount < 2 ? "EXECUTING" : "SUCCEEDED",
                operationKey: "tx:key:1",
                resourceId: "wdg_123",
                dependencies: [],
                createdAt: "2026-09-01T00:00:00Z",
                updatedAt: "2026-09-01T00:00:05Z",
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
  };

  const mcpx = new MCPx({
    endpoint: "http://localhost:3000",
    fetch: mockFetch as any,
    pollingIntervalMs: 50,
  });

  const run = await mcpx.transactions.get("tx_test_wait");
  assert.strictEqual(run.id, "tx_test_wait");
  assert.strictEqual(run.status, "ACTIVE");

  const result = await run.wait({ timeoutMs: 2000, pollingIntervalMs: 50 });
  assert.strictEqual(result.status, "COMMITTED");
  assert.strictEqual(result.transactionId, "tx_test_wait");
  assert.ok(result.outputs.step_1);
  assert.strictEqual((result.outputs.step_1 as any).resourceId, "wdg_123");
});
