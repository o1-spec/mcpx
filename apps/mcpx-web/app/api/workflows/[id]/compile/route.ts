import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflow,
  getContract,
  getConnectedService,
  initCoordinatorDb,
  pool,
} from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initCoordinatorDb();
    const { id } = await params;
    const workflow = await getWorkflow(id);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { runInputs, scenario } = body;

    const transactionId = `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Create transaction row linked to workflow
      await client.query(
        `INSERT INTO transactions (id, state, scenario, workflow_id, next_event_sequence, created_at, updated_at)
         VALUES ($1, 'PLANNING', $2, $3, 1, $4, $4)`,
        [transactionId, scenario || workflow.name, workflow.id, now]
      );

      // 2. Compile and insert each workflow node into transaction_nodes
      const compiledNodes = [];
      for (const node of workflow.nodes) {
        const contract = await getContract(node.contractId);
        if (!contract) {
          throw new Error(`Contract '${node.contractId}' missing for step '${node.stepKey}'`);
        }
        const service = await getConnectedService(contract.serviceId);
        if (!service) {
          throw new Error(`Service '${contract.serviceId}' missing for contract '${contract.name}'`);
        }

        const operationKey = `tx:${transactionId}:${node.stepKey}`;
        const inputArgs: Record<string, unknown> = {};

        // Resolve input bindings
        if (node.inputConfig) {
          for (const [key, binding] of Object.entries(node.inputConfig)) {
            if (binding.type === "static") {
              inputArgs[key] = binding.value;
            }
          }
        }

        // Apply any run-time overrides
        if (runInputs && typeof runInputs[node.stepKey] === "object") {
          Object.assign(inputArgs, runInputs[node.stepKey]);
        }

        // Always inject operationKey
        inputArgs[contract.operationKeyField || "operationKey"] = operationKey;

        await client.query(
          `INSERT INTO transaction_nodes (
            id, transaction_id, service, label, origin, execute_tool, inspect_tool, compensate_tool,
            state, operation_key, dependencies, execute_args, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10, $11, $12, $12)`,
          [
            node.stepKey,
            transactionId,
            service.name,
            node.label,
            service.origin,
            contract.executeToolName,
            contract.inspectToolName,
            contract.compensateToolName || "",
            operationKey,
            JSON.stringify(node.dependencies || []),
            JSON.stringify(inputArgs),
            now,
          ]
        );

        compiledNodes.push({
          id: node.stepKey,
          service: service.name,
          label: node.label,
          origin: service.origin,
          executeTool: contract.executeToolName,
          inspectTool: contract.inspectToolName,
          compensateTool: contract.compensateToolName,
          operationKeyField: contract.operationKeyField || "operationKey",
          state: "PENDING",
          operationKey,
          dependencies: node.dependencies || [],
          executeArgs: inputArgs,
        });
      }

      await client.query("COMMIT");

      return NextResponse.json({
        transactionId,
        workflowId: workflow.id,
        nodes: compiledNodes,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    console.error("[mcpx-workflows] Compile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compile workflow" },
      { status: 500 }
    );
  }
}
