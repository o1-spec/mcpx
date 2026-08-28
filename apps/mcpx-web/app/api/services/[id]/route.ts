import { NextRequest, NextResponse } from "next/server";
import {
  getConnectedService,
  updateConnectedServiceTools,
  deleteConnectedService,
  initCoordinatorDb,
} from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const service = await getConnectedService(id);
    if (!service) {
      return NextResponse.json({ error: "Connected service not found" }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch (err: unknown) {
    console.error("[mcpx-api] GET /api/services/[id] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch service" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const body = await req.json();
    const { tools } = body;

    if (!Array.isArray(tools)) {
      return NextResponse.json({ error: "Tools must be an array" }, { status: 400 });
    }

    await updateConnectedServiceTools(id, tools);
    const updated = await getConnectedService(id);
    return NextResponse.json({ service: updated });
  } catch (err: unknown) {
    console.error("[mcpx-api] PATCH /api/services/[id] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update service" },
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
    const success = await deleteConnectedService(id);
    if (!success) {
      return NextResponse.json({ error: "Connected service not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    console.error("[mcpx-api] DELETE /api/services/[id] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete service" },
      { status: 500 }
    );
  }
}
