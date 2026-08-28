import { NextRequest, NextResponse } from "next/server";
import {
  listContractsForService,
  createReliabilityContract,
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
    const service = await getConnectedService(id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const contracts = await listContractsForService(id);
    return NextResponse.json({ contracts });
  } catch (err: unknown) {
    console.error("[mcpx-contracts] GET contracts failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list contracts" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const service = await getConnectedService(id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      executeToolName,
      inspectToolName,
      compensateToolName,
      operationKeyField,
      assertions,
      executeSchemaSnapshot,
      inspectSchemaSnapshot,
      compensateSchemaSnapshot,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Contract name is required" }, { status: 400 });
    }

    if (!executeToolName || typeof executeToolName !== "string") {
      return NextResponse.json({ error: "Execute tool is required" }, { status: 400 });
    }

    if (!inspectToolName || typeof inspectToolName !== "string") {
      return NextResponse.json({ error: "Inspect tool is required" }, { status: 400 });
    }

    const opKey = (operationKeyField || "operationKey").trim();

    // Validate tools exist in discovered tools
    const tools = service.lastDiscoveredTools || [];
    const execTool = tools.find((t) => t.name === executeToolName);
    const inspTool = tools.find((t) => t.name === inspectToolName);
    const compTool = compensateToolName ? tools.find((t) => t.name === compensateToolName) : null;

    if (!execTool) {
      return NextResponse.json(
        { error: `Execute tool '${executeToolName}' is not in discovered tools` },
        { status: 400 }
      );
    }

    if (!inspTool) {
      return NextResponse.json(
        { error: `Inspect tool '${inspectToolName}' is not in discovered tools` },
        { status: 400 }
      );
    }

    if (compensateToolName && !compTool) {
      return NextResponse.json(
        { error: `Compensate tool '${compensateToolName}' is not in discovered tools` },
        { status: 400 }
      );
    }

    // Determine readiness status based on developer assertions and schema validation
    const hasAssertions =
      assertions?.executeIdempotent === true &&
      assertions?.inspectAuthoritative === true &&
      (!compensateToolName || assertions?.compensateRetrySafe === true);

    const status: "READY" | "INVALID" = hasAssertions ? "READY" : "INVALID";

    const contract = await createReliabilityContract({
      serviceId: id,
      name: name.trim(),
      executeToolName,
      inspectToolName,
      compensateToolName: compensateToolName || null,
      operationKeyField: opKey,
      assertions: assertions || {},
      status,
      executeSchemaSnapshot: executeSchemaSnapshot || execTool.inputSchema || null,
      inspectSchemaSnapshot: inspectSchemaSnapshot || inspTool.inputSchema || null,
      compensateSchemaSnapshot: compensateSchemaSnapshot || compTool?.inputSchema || null,
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (err: unknown) {
    console.error("[mcpx-contracts] POST contract failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create contract" },
      { status: 500 }
    );
  }
}
