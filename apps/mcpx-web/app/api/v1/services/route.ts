import { NextRequest, NextResponse } from "next/server";
import { listConnectedServices, createConnectedService, initCoordinatorDb } from "@/lib/db";

export async function GET() {
  try {
    await initCoordinatorDb();
    const services = await listConnectedServices();
    return NextResponse.json({
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        origin: s.origin,
        tools: s.lastDiscoveredTools,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] GET /api/v1/services failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initCoordinatorDb();
    const body = await request.json();
    const { origin, name, tools = [] } = body;

    if (!origin || typeof origin !== "string" || !origin.trim()) {
      return NextResponse.json({ error: "Missing required field: origin" }, { status: 400 });
    }

    const serviceName = name && typeof name === "string" && name.trim() ? name.trim() : new URL(origin).hostname;

    const service = await createConnectedService({
      origin: origin.trim(),
      name: serviceName,
      tools,
    });

    return NextResponse.json(
      {
        service: {
          id: service.id,
          name: service.name,
          origin: service.origin,
          tools: service.lastDiscoveredTools,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] POST /api/v1/services failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
