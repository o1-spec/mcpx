import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;

    const client = await pool.connect();
    try {
      const txRes = await client.query(
        `SELECT id, state, scenario, workflow_id, last_error, created_at, updated_at 
         FROM transactions WHERE id = $1`,
        [id]
      );

      if (txRes.rows.length === 0) {
        return NextResponse.json({ error: `Transaction '${id}' not found` }, { status: 404 });
      }

      const nodesRes = await client.query(
        `SELECT id, service, label, origin, execute_tool, inspect_tool, compensate_tool,
                state, operation_key, resource_id, dependencies, execute_args, last_error,
                created_at, updated_at
         FROM transaction_nodes 
         WHERE transaction_id = $1 
         ORDER BY created_at ASC`,
        [id]
      );

      const nodes = nodesRes.rows.map((row) => ({
        id: row.id,
        service: row.service,
        label: row.label,
        origin: row.origin,
        executeTool: row.execute_tool,
        inspectTool: row.inspect_tool,
        compensateTool: row.compensate_tool,
        state: row.state,
        operationKey: row.operation_key,
        resourceId: row.resource_id,
        dependencies: Array.isArray(row.dependencies) ? row.dependencies : JSON.parse(row.dependencies || "[]"),
        executeArgs: typeof row.execute_args === "object" ? row.execute_args : JSON.parse(row.execute_args || "{}"),
        lastError: row.last_error,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }));

      const eventsRes = await client.query(
        `SELECT id, sequence, node_id, event_type, payload, occurred_at 
         FROM transaction_events 
         WHERE transaction_id = $1 
         ORDER BY sequence ASC, occurred_at ASC`,
        [id]
      );

      const events = eventsRes.rows.map((row) => ({
        id: row.id,
        sequence: row.sequence,
        nodeId: row.node_id,
        type: row.event_type,
        details: typeof row.payload === "object" ? row.payload : JSON.parse(row.payload || "{}"),
        timestamp: row.occurred_at.toISOString(),
      }));

      return NextResponse.json({
        transaction: {
          id: txRes.rows[0].id,
          state: txRes.rows[0].state,
          scenario: txRes.rows[0].scenario,
          workflowId: txRes.rows[0].workflow_id,
          lastError: txRes.rows[0].last_error,
          createdAt: txRes.rows[0].created_at.toISOString(),
          updatedAt: txRes.rows[0].updated_at.toISOString(),
          nodes,
        },
        events,
      });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] GET /api/v1/transactions/:id failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
