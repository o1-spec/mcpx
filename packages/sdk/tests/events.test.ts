import { test } from "node:test";
import assert from "node:assert";
import { MCPx } from "../src/index.js";

test("Transaction events querying and async iteration", async () => {
  const mockEvents = [
    {
      id: "ev_1",
      sequence: 1,
      transactionId: "tx_stream_1",
      type: "TRANSACTION_STARTED",
      details: { workflowName: "Pipeline" },
      timestamp: "2026-09-01T00:00:01Z",
    },
    {
      id: "ev_2",
      sequence: 2,
      transactionId: "tx_stream_1",
      nodeId: "step_db",
      type: "NODE_EXECUTING",
      details: { label: "Database" },
      timestamp: "2026-09-01T00:00:02Z",
    },
    {
      id: "ev_3",
      sequence: 3,
      transactionId: "tx_stream_1",
      nodeId: "step_db",
      type: "NODE_SUCCEEDED",
      details: { label: "Database", resourceId: "db_999" },
      timestamp: "2026-09-01T00:00:03Z",
    },
    {
      id: "ev_4",
      sequence: 4,
      transactionId: "tx_stream_1",
      type: "TRANSACTION_COMMITTED",
      details: {},
      timestamp: "2026-09-01T00:00:04Z",
    },
  ];

  const mockFetch = async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes("/api/v1/transactions/tx_stream_1/events")) {
      return new Response(JSON.stringify({ events: mockEvents }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.includes("/api/v1/transactions/tx_stream_1")) {
      return new Response(
        JSON.stringify({
          transaction: {
            id: "tx_stream_1",
            state: "COMMITTED",
            scenario: "Pipeline",
            createdAt: "2026-09-01T00:00:00Z",
            updatedAt: "2026-09-01T00:00:04Z",
            nodes: [],
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
  });

  const run = await mcpx.transactions.get("tx_stream_1");
  const collectedEvents = [];

  for await (const ev of run.events()) {
    collectedEvents.push(ev);
  }

  assert.strictEqual(collectedEvents.length, 4);
  assert.strictEqual(collectedEvents[0]?.sequence, 1);
  assert.strictEqual(collectedEvents[3]?.type, "TRANSACTION_COMMITTED");
});
