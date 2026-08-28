import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflow,
  deleteWorkflow,
  getContract,
  getConnectedService,
  listTransactionsForWorkflow,
  initCoordinatorDb,
} from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const workflow = await getWorkflow(id);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Enrich nodes with contract and service metadata
    const enrichedNodes = [];
    for (const node of workflow.nodes) {
      const contract = await getContract(node.contractId);
      let service = null;
      if (contract) {
        service = await getConnectedService(contract.serviceId);
      }
      enrichedNodes.push({
        ...node,
        contract,
        service,
      });
    }

    const recentRuns = await listTransactionsForWorkflow(id);

    return NextResponse.json({
      workflow: {
        ...workflow,
        nodes: enrichedNodes,
      },
      recentRuns,
    });
  } catch (err: unknown) {
    console.error("[mcpx-workflows] GET /api/workflows/[id] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const success = await deleteWorkflow(id);
    if (!success) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    console.error("[mcpx-workflows] DELETE /api/workflows/[id] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
