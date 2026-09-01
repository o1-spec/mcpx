import { NextRequest, NextResponse } from "next/server";
import { pool, initCoordinatorDb, executeAtomicTransition } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id: transactionId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Approved compensation by policy / operator";

    const client = await pool.connect();
    let txRow: Record<string, unknown> | null = null;
    try {
      const txRes = await client.query(
        `SELECT id, state, scenario, workflow_id, last_error, created_at, updated_at 
         FROM transactions WHERE id = $1`,
        [transactionId]
      );
      if (txRes.rows.length === 0) {
        return NextResponse.json({ error: `Transaction '${transactionId}' not found` }, { status: 404 });
      }
      txRow = txRes.rows[0];
    } finally {
      client.release();
    }

    // Atomic transition to COMPENSATING state and emit sequence event
    await executeAtomicTransition({
      transactionId,
      txState: "COMPENSATING",
      eventType: "TRANSACTION_COMPENSATING",
      eventPayload: { reason },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        ...txRow,
        state: "COMPENSATING",
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] POST /api/v1/transactions/:id/compensation/approve failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
