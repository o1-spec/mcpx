import { NextRequest, NextResponse } from "next/server";
import { listWorkflows, createWorkflow, initCoordinatorDb } from "@/lib/db";

export async function GET() {
  try {
    await initCoordinatorDb();
    const workflows = await listWorkflows();
    const summaries = workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      description: wf.description,
      nodeCount: wf.nodes.length,
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    }));

    return NextResponse.json({ workflows: summaries });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] GET /api/v1/workflows failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initCoordinatorDb();
    const body = await request.json();
    const { name, description, nodes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: "Workflow must have at least one node" }, { status: 400 });
    }

    const workflow = await createWorkflow({
      name: name.trim(),
      description: description || undefined,
      nodes: nodes.map(
        (
          node: {
            stepKey?: string;
            id?: string;
            label?: string;
            contractId: string;
            dependencies?: string[];
            inputConfig?: Record<string, unknown>;
            inputBindings?: Record<string, unknown>;
            position?: number;
          },
          idx: number
        ) => {
          const rawConfig = node.inputConfig || node.inputBindings || {};
          const normalizedConfig: Record<string, { type: "static" | "dependency_output"; value?: unknown; stepId?: string; field?: string }> = {};

          for (const [k, v] of Object.entries(rawConfig)) {
            if (v && typeof v === "object" && ("type" in v)) {
              normalizedConfig[k] = v as { type: "static" | "dependency_output"; value?: unknown; stepId?: string; field?: string };
            } else {
              normalizedConfig[k] = { type: "static", value: v };
            }
          }

          return {
            stepKey: node.stepKey || node.id || `step_${idx + 1}`,
            label: node.label || `Step ${idx + 1}`,
            contractId: node.contractId,
            dependencies: node.dependencies || [],
            inputConfig: normalizedConfig,
            position: node.position ?? idx,
          };
        }
      ),
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] POST /api/v1/workflows failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
