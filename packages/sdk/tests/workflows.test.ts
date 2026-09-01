import { test } from "node:test";
import assert from "node:assert";
import { MCPx } from "../src/index.js";

test("Workflows client list and create mock round-trip", async () => {
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || "GET";

    if (url.includes("/api/v1/workflows") && method === "GET") {
      return new Response(
        JSON.stringify({
          workflows: [
            {
              id: "wf_1",
              name: "Deploy Storefront",
              description: "Production store deployment",
              nodeCount: 4,
              createdAt: "2026-09-01T00:00:00Z",
              updatedAt: "2026-09-01T00:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.includes("/api/v1/workflows/wf_1/runs") && method === "POST") {
      return new Response(
        JSON.stringify({
          transaction: {
            id: "tx_mock_1",
            state: "ACTIVE",
            scenario: "Deploy Storefront",
            workflowId: "wf_1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: [
              {
                id: "step_db",
                service: "Database",
                label: "Provision Database",
                state: "PENDING",
                operationKey: "tx:mock:1:db",
                dependencies: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          workflow: { id: "wf_1", name: "Deploy Storefront" },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
  };

  const mcpx = new MCPx({
    endpoint: "http://localhost:3000",
    fetch: mockFetch as any,
  });

  const list = await mcpx.workflows.list();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0]?.name, "Deploy Storefront");

  const run = await mcpx.workflows.run("wf_1", { project: "acme" });
  assert.strictEqual(run.id, "tx_mock_1");
  assert.strictEqual(run.status, "ACTIVE");
  assert.strictEqual(run.consoleUrl, "http://localhost:3000/app/transactions/tx_mock_1");
  assert.strictEqual(run.nodes.length, 1);
});
