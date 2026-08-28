import { NextRequest, NextResponse } from "next/server";
import { listConnectedServices, createConnectedService, initCoordinatorDb } from "@/lib/db";

export async function GET() {
  try {
    await initCoordinatorDb();
    const services = await listConnectedServices();
    return NextResponse.json({ services });
  } catch (err: unknown) {
    console.error("[mcpx-api] GET /api/services failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list connected services" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await initCoordinatorDb();
    const body = await req.json();
    const { name, origin, tools } = body;

    if (!origin || typeof origin !== "string") {
      return NextResponse.json({ error: "Valid origin URL is required" }, { status: 400 });
    }

    // Origin normalization & validation
    let normalizedOrigin: string;
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return NextResponse.json(
          { error: "Origin must use http: or https: protocol" },
          { status: 400 }
        );
      }
      normalizedOrigin = parsed.origin;
    } catch {
      return NextResponse.json({ error: "Invalid origin URL format" }, { status: 400 });
    }

    const serviceName = name?.trim() || new URL(normalizedOrigin).hostname || "Connected Service";

    const service = await createConnectedService({
      name: serviceName,
      origin: normalizedOrigin,
      tools: Array.isArray(tools) ? tools : [],
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (err: unknown) {
    console.error("[mcpx-api] POST /api/services failed:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate key")) {
      return NextResponse.json(
        { error: "This service origin is already connected." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
