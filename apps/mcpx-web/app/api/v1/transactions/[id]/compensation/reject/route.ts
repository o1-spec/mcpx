import { NextRequest, NextResponse } from "next/server";
import { executeAtomicTransition, initCoordinatorDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id: transactionId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Compensation rejected by policy / operator (resources retained)";

    const res = await executeAtomicTransition({
      transactionId,
      txState: "FAILED",
      lastError: reason,
      eventType: "COMPENSATION_REJECTED",
      eventPayload: { reason },
    });

    return NextResponse.json({
      success: true,
      transaction: res.transaction,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] POST /api/v1/transactions/:id/compensation/reject failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
