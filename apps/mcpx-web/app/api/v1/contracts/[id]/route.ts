import { NextRequest, NextResponse } from "next/server";
import { getContract, deleteReliabilityContract, initCoordinatorDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const contract = await getContract(id);
    if (!contract) {
      return NextResponse.json({ error: `Contract '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json({ contract });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] GET /api/v1/contracts/[id] failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const success = await deleteReliabilityContract(id);
    if (!success) {
      return NextResponse.json({ error: `Contract '${id}' not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] DELETE /api/v1/contracts/[id] failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
