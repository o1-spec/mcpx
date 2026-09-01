import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initCoordinatorDb();
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get("state");
    const workflowId = searchParams.get("workflowId");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const client = await pool.connect();
    try {
      let query = `
        SELECT id, state, scenario, workflow_id, last_error, created_at, updated_at
        FROM transactions
      `;
      const conditions: string[] = [];
      const values: unknown[] = [];

      if (state) {
        values.push(state);
        conditions.push(`state = $${values.length}`);
      }
      if (workflowId) {
        values.push(workflowId);
        conditions.push(`workflow_id = $${values.length}`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      values.push(limit);
      query += ` ORDER BY created_at DESC LIMIT $${values.length}`;
      values.push(offset);
      query += ` OFFSET $${values.length}`;

      const res = await client.query(query, values);

      const transactions = [];
      for (const row of res.rows) {
        const nodesRes = await client.query(
          `SELECT id, service, label, origin, execute_tool, inspect_tool, compensate_tool,
                  state, operation_key, resource_id, dependencies, execute_args, last_error,
                  created_at, updated_at
           FROM transaction_nodes
           WHERE transaction_id = $1
           ORDER BY created_at ASC`,
          [row.id]
        );

        transactions.push({
          id: row.id,
          state: row.state,
          scenario: row.scenario,
          workflowId: row.workflow_id,
          lastError: row.last_error,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          nodes: nodesRes.rows.map((n) => ({
            id: n.id,
            service: n.service,
            label: n.label,
            origin: n.origin,
            executeTool: n.execute_tool,
            inspectTool: n.inspect_tool,
            compensateTool: n.compensate_tool,
            state: n.state,
            operationKey: n.operation_key,
            resourceId: n.resource_id,
            dependencies: Array.isArray(n.dependencies) ? n.dependencies : JSON.parse(n.dependencies || "[]"),
            executeArgs: typeof n.execute_args === "object" ? n.execute_args : JSON.parse(n.execute_args || "{}"),
            lastError: n.last_error,
            createdAt: n.created_at.toISOString(),
            updatedAt: n.updated_at.toISOString(),
          })),
        });
      }

      return NextResponse.json({ transactions });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] GET /api/v1/transactions failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
