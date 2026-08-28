import { NextRequest, NextResponse } from "next/server";
import { getContract, deleteReliabilityContract, initCoordinatorDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  try {
    await initCoordinatorDb();
    const { contractId } = await params;
    const contract = await getContract(contractId);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    return NextResponse.json({ contract });
  } catch (err: unknown) {
    console.error("[mcpx-contracts] GET contract failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch contract" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  try {
    await initCoordinatorDb();
    const { contractId } = await params;
    const success = await deleteReliabilityContract(contractId);
    if (!success) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, contractId });
  } catch (err: unknown) {
    console.error("[mcpx-contracts] DELETE contract failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete contract" },
      { status: 500 }
    );
  }
}
