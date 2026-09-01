import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflow,
  deleteWorkflow,
  getContract,
  getConnectedService,
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
      return NextResponse.json({ error: `Workflow '${id}' not found` }, { status: 404 });
    }

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

    return NextResponse.json({
      workflow: {
        ...workflow,
        nodes: enrichedNodes,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] GET /api/v1/workflows/[id] failed:", err);
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
    const success = await deleteWorkflow(id);
    if (!success) {
      return NextResponse.json({ error: `Workflow '${id}' not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] DELETE /api/v1/workflows/[id] failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
