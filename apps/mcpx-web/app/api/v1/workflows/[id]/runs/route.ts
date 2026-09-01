import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflow,
  listWorkflows,
  getContract,
  getConnectedService,
  initCoordinatorDb,
  pool,
  type WorkflowRecord,
} from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const runtimeInput = body.input || {};

    let workflow: WorkflowRecord | null = await getWorkflow(id);

    if (!workflow) {
      const all = await listWorkflows();
      workflow =
        all.find((w) => w.name.toLowerCase() === id.toLowerCase() || w.name.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase()) || null;
    }

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
        id: node.stepKey || node.id,
        label: node.label,
        service: service?.name || "Service",
        origin: service?.origin || "",
        executeTool: contract?.executeToolName || "",
        inspectTool: contract?.inspectToolName || "",
        compensateTool: contract?.compensateToolName || null,
        operationKey: `tx:${Date.now()}:${(node.label || node.id).toLowerCase().replace(/\s+/g, "-")}`,
        dependencies: node.dependencies || [],
        executeArgs: {
          ...(node.inputConfig || {}),
          ...runtimeInput,
        },
      });
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check active runners
      const runnerRes = await client.query(
        `SELECT COUNT(*)::int as count FROM runner_workers WHERE last_heartbeat_at > NOW() - INTERVAL '20 seconds'`
      );
      const activeRunners = runnerRes.rows[0]?.count ?? 0;

      await client.query(
        `INSERT INTO transactions (id, state, scenario, workflow_id, next_event_sequence, created_at, updated_at)
         VALUES ($1, 'ACTIVE', $2, $3, 2, NOW(), NOW())`,
        [txId, workflow.name, workflow.id]
      );

      for (const node of enrichedNodes) {
        await client.query(
          `INSERT INTO transaction_nodes (
            id, transaction_id, service, label, origin, execute_tool, inspect_tool,
            compensate_tool, state, operation_key, dependencies, execute_args, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10, $11, NOW(), NOW())`,
          [
            node.id,
            txId,
            node.service,
            node.label,
            node.origin,
            node.executeTool,
            node.inspectTool,
            node.compensateTool,
            node.operationKey,
            JSON.stringify(node.dependencies),
            JSON.stringify(node.executeArgs),
          ]
        );
      }

      await client.query(
        `INSERT INTO transaction_events (id, transaction_id, sequence, event_type, payload, occurred_at)
         VALUES ($1, $2, 1, 'TRANSACTION_STARTED', $3, NOW())`,
        [crypto.randomUUID(), txId, JSON.stringify({ workflowId: workflow.id, workflowName: workflow.name, totalNodes: enrichedNodes.length, activeRunners })]
      );

      if (activeRunners === 0) {
        await client.query(
          `INSERT INTO transaction_events (id, transaction_id, sequence, event_type, payload, occurred_at)
           VALUES ($1, $2, 2, 'RUNNER_WAITING', $3, NOW())`,
          [crypto.randomUUID(), txId, JSON.stringify({ message: "Waiting for active browser WebMCP runner..." })]
        );
        await client.query(`UPDATE transactions SET next_event_sequence = 3 WHERE id = $1`, [txId]);
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json(
      {
        transaction: {
          id: txId,
          state: "ACTIVE",
          scenario: workflow.name,
          workflowId: workflow.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: enrichedNodes.map((n) => ({
            ...n,
            state: "PENDING",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        },
        workflow,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] POST /api/v1/workflows/[id]/runs failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
