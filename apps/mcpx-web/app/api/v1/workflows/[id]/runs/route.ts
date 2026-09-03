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

    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const workspaceName = runtimeInput.workspaceName || runtimeInput.name || "invoices-prod";

    const dbOrigin = process.env.NEXT_PUBLIC_DATABASE_ORIGIN || "https://mcpx-database-app.vercel.app";
    const computeOrigin = process.env.NEXT_PUBLIC_COMPUTE_ORIGIN || "https://mcpx-compute-app.vercel.app";
    const routingOrigin = process.env.NEXT_PUBLIC_ROUTING_ORIGIN || "https://mcpx-routing-app.vercel.app";
    const frontendOrigin = process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || "https://mcpx-frontend-app.vercel.app";

    let enrichedNodes: Array<{
      id: string;
      label: string;
      service: string;
      origin: string;
      executeTool: string;
      inspectTool: string;
      compensateTool: string | null;
      operationKey: string;
      dependencies: string[];
      executeArgs: Record<string, unknown>;
    }> = [];

    const isChallengeWorkflow =
      !workflow ||
      id === "challenge-workflow" ||
      id === "deploy-infrastructure" ||
      id === "workspace-provisioning" ||
      id === "default";

    if (isChallengeWorkflow || !workflow) {
      enrichedNodes = [
        {
          id: "database:create",
          label: "Database Service (create_database)",
          service: "database",
          origin: dbOrigin,
          executeTool: "create_database",
          inspectTool: "get_database",
          compensateTool: "delete_database",
          operationKey: `${txId}:database:create`,
          dependencies: [],
          executeArgs: {
            name: workspaceName,
            operationKey: `${txId}:database:create`,
            ...runtimeInput,
          },
        },
        {
          id: "backend:deploy",
          label: "Compute Service (deploy_backend)",
          service: "compute",
          origin: computeOrigin,
          executeTool: "deploy_backend",
          inspectTool: "get_backend",
          compensateTool: "delete_backend",
          operationKey: `${txId}:backend:deploy`,
          dependencies: ["database:create"],
          executeArgs: {
            projectName: workspaceName,
            operationKey: `${txId}:backend:deploy`,
            ...runtimeInput,
          },
        },
        {
          id: "routing:create",
          label: "Routing Service (create_route)",
          service: "routing",
          origin: routingOrigin,
          executeTool: "create_route",
          inspectTool: "get_route",
          compensateTool: "delete_route",
          operationKey: `${txId}:routing:create`,
          dependencies: ["backend:deploy"],
          executeArgs: {
            projectName: workspaceName,
            targetUrl: `https://${workspaceName}.internal`,
            operationKey: `${txId}:routing:create`,
            failureMode: "drop-ack-after-commit",
            ...runtimeInput,
          },
        },
        {
          id: "frontend:deploy",
          label: "Frontend Service (deploy_frontend)",
          service: "frontend",
          origin: frontendOrigin,
          executeTool: "deploy_frontend",
          inspectTool: "get_frontend",
          compensateTool: "delete_frontend",
          operationKey: `${txId}:frontend:deploy`,
          dependencies: ["routing:create"],
          executeArgs: {
            projectName: workspaceName,
            operationKey: `${txId}:frontend:deploy`,
            failureMode: "reject",
            ...runtimeInput,
          },
        },
      ];
    } else {
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
    }

    const workflowName = workflow?.name || (id === "challenge-workflow" ? "Challenge Workflow" : "Deploy Infrastructure");
    const workflowId = workflow?.id || id;

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
        [txId, workflowName, workflowId]
      );

      for (const node of enrichedNodes) {
        await client.query(
          `INSERT INTO transaction_nodes (
            id, transaction_id, service, label, origin, execute_tool, inspect_tool,
            compensate_tool, state, operation_key, dependencies, execute_args, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10, $11, NOW(), NOW())
          ON CONFLICT (transaction_id, id) DO UPDATE SET
            state = EXCLUDED.state,
            operation_key = EXCLUDED.operation_key,
            dependencies = EXCLUDED.dependencies,
            execute_args = EXCLUDED.execute_args,
            updated_at = NOW()`,
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
        [crypto.randomUUID(), txId, JSON.stringify({ workflowId, workflowName, totalNodes: enrichedNodes.length, activeRunners })]
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
          scenario: workflowName,
          workflowId: workflowId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: enrichedNodes.map((n) => ({
            ...n,
            state: "PENDING",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        },
        workflow: workflow || {
          id: workflowId,
          name: workflowName,
          description: "Built-in 4-Service WebMCP Deployment Pipeline",
          nodes: enrichedNodes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcpx-v1] POST /api/v1/workflows/[id]/runs failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
