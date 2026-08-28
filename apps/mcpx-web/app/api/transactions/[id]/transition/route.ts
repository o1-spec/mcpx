import { NextRequest, NextResponse } from "next/server";
import { executeAtomicTransition } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params;
    const body = await request.json();
    const {
      nodeId,
      nodeState,
      resourceId,
      lastError,
      executeArgs,
      txState,
      eventType,
      eventPayload,
    } = body;

    if (!eventType) {
      return NextResponse.json({ error: "Missing required field: eventType" }, { status: 400 });
    }

    const result = await executeAtomicTransition({
      transactionId,
      nodeId,
      nodeState,
      resourceId,
      lastError,
      executeArgs,
      txState,
      eventType,
      eventPayload,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-web] POST /api/transactions/:id/transition failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
