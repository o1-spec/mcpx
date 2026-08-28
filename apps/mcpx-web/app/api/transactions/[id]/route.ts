import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;

    const client = await pool.connect();
    try {
      // 1. Fetch transaction
      const txRes = await client.query(
        `SELECT id, state, scenario, last_error, created_at, updated_at 
         FROM transactions WHERE id = $1`,
        [id]
      );

      if (txRes.rows.length === 0) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      // 2. Fetch nodes
      const nodesRes = await client.query(
        `SELECT id, service, label, origin, execute_tool, inspect_tool, compensate_tool,
                state, operation_key, resource_id, dependencies, execute_args, last_error,
                created_at, updated_at
         FROM transaction_nodes 
         WHERE transaction_id = $1 
         ORDER BY created_at ASC`,
        [id]
      );

      // Map snake_case to camelCase
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
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      // 3. Fetch events in strict sequence order
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
          lastError: txRes.rows[0].last_error,
          createdAt: txRes.rows[0].created_at,
          updatedAt: txRes.rows[0].updated_at,
          nodes,
        },
        events,
      });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-web] GET /api/transactions/:id failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const body = await request.json();
    const { state, lastError } = body;

    const client = await pool.connect();
    try {
      const res = await client.query(
        `UPDATE transactions 
         SET state = COALESCE($1, state),
             last_error = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [state ?? null, lastError ?? null, id]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, transaction: res.rows[0] });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-web] PATCH /api/transactions/:id failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
