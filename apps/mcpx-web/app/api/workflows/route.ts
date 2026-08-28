import { NextRequest, NextResponse } from "next/server";
import { listWorkflows, createWorkflow, getContract, getConnectedService, initCoordinatorDb } from "@/lib/db";

// Graph cycle detection helper
function hasCycle(nodes: Array<{ stepKey: string; dependencies: string[] }>): boolean {
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    adj.set(n.stepKey, n.dependencies || []);
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(curr: string): boolean {
    visited.add(curr);
    recStack.add(curr);

    const neighbors = adj.get(curr) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(curr);
    return false;
  }

  for (const n of nodes) {
    if (!visited.has(n.stepKey)) {
      if (dfs(n.stepKey)) return true;
    }
  }
  return false;
}

export async function GET() {
  try {
    await initCoordinatorDb();
    const workflows = await listWorkflows();
    return NextResponse.json({ workflows });
  } catch (err: unknown) {
    console.error("[mcpx-workflows] GET /api/workflows failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list workflows" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await initCoordinatorDb();
    const body = await req.json();
    const { name, description, nodes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Workflow name is required" }, { status: 400 });
    }

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: "Workflow must contain at least one step" }, { status: 400 });
    }

    // Validate step keys are unique
    const stepKeys = new Set<string>();
    for (const n of nodes) {
      if (!n.stepKey || typeof n.stepKey !== "string") {
        return NextResponse.json({ error: "Each step must have a unique stepKey" }, { status: 400 });
      }
      if (stepKeys.has(n.stepKey)) {
        return NextResponse.json({ error: `Duplicate stepKey '${n.stepKey}' in workflow` }, { status: 400 });
      }
      stepKeys.add(n.stepKey);
    }

    // Validate all referenced contracts exist and are READY
    for (const n of nodes) {
      if (!n.contractId) {
        return NextResponse.json({ error: `Step '${n.stepKey}' missing contractId` }, { status: 400 });
      }
      const contract = await getContract(n.contractId);
      if (!contract) {
        return NextResponse.json({ error: `Contract '${n.contractId}' not found` }, { status: 400 });
      }
      if (contract.status === "INVALID") {
        return NextResponse.json(
          { error: `Contract '${contract.name}' is INVALID and cannot be added to a workflow` },
          { status: 400 }
        );
      }
    }

    // Validate dependencies reference valid existing steps and avoid cycles
    for (const n of nodes) {
      const deps = n.dependencies || [];
      for (const d of deps) {
        if (!stepKeys.has(d)) {
          return NextResponse.json(
            { error: `Step '${n.stepKey}' depends on non-existent step '${d}'` },
            { status: 400 }
          );
        }
        if (d === n.stepKey) {
          return NextResponse.json(
            { error: `Step '${n.stepKey}' cannot depend on itself` },
            { status: 400 }
          );
        }
      }
    }

    // Check for graph cycles
    if (hasCycle(nodes)) {
      return NextResponse.json(
        { error: "This workflow contains a dependency cycle." },
        { status: 400 }
      );
    }

    const workflow = await createWorkflow({
      name: name.trim(),
      description: description?.trim() || null,
      nodes: nodes.map((n, idx) => ({
        stepKey: n.stepKey,
        label: n.label || n.stepKey,
        contractId: n.contractId,
        dependencies: n.dependencies || [],
        inputConfig: n.inputConfig || {},
        position: idx,
      })),
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (err: unknown) {
    console.error("[mcpx-workflows] POST /api/workflows failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create workflow" },
      { status: 500 }
    );
  }
}
