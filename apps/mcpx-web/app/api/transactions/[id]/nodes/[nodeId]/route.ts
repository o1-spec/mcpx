import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id: transactionId, nodeId } = await params;
    const body = await request.json();
    const { state, resourceId, lastError, executeArgs } = body;

    const client = await pool.connect();
    try {
      const res = await client.query(
        `UPDATE transaction_nodes
         SET state = COALESCE($1, state),
             resource_id = COALESCE($2, resource_id),
             last_error = $3,
             execute_args = COALESCE($4, execute_args),
             updated_at = NOW()
         WHERE transaction_id = $5 AND id = $6
         RETURNING *`,
        [
          state ?? null,
          resourceId ?? null,
          lastError ?? null,
          executeArgs ? JSON.stringify(executeArgs) : null,
          transactionId,
          nodeId,
        ]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ error: "Node not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, node: res.rows[0] });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-web] PATCH /api/transactions/:id/nodes/:nodeId failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
