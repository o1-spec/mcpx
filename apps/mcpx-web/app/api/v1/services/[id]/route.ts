import { NextRequest, NextResponse } from "next/server";
import { getConnectedService, pool, initCoordinatorDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const service = await getConnectedService(id);
    if (!service) {
      return NextResponse.json({ error: `Service '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      service: {
        id: service.id,
        name: service.name,
        origin: service.origin,
        tools: service.lastDiscoveredTools,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] GET /api/v1/services/[id] failed:", err);
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

    const client = await pool.connect();
    try {
      const res = await client.query(`DELETE FROM connected_services WHERE id = $1`, [id]);
      if ((res.rowCount ?? 0) === 0) {
        return NextResponse.json({ error: `Service '${id}' not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, id });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] DELETE /api/v1/services/[id] failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
