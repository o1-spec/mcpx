import { pool, initCoordinatorDb, executeAtomicTransition, type WorkflowRecord } from "@/lib/db";
import { origins } from "@/lib/config/origins";

interface ServerRunnerNode {
  id: string;
  service: string;
  label: string;
  origin: string;
  executeTool: string;
  inspectTool: string;
  compensateTool: string | null;
  state: string;
  operationKey: string;
  resourceId?: string | null;
  dependencies: string[];
  executeArgs: Record<string, unknown>;
}

/**
 * Dispatches a WebMCP tool execution via HTTP bridge to the service hosting the WebMCP endpoint.
 * In a native WebMCP browser environment, this is handled via document.modelContext.executeTool().
 * For server/SDK runner processes, this queries the registered service origin.
 */
async function dispatchServiceTool(
  origin: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<{ exists?: boolean; resourceId?: string; [key: string]: unknown }> {
  const normalizedOrigin = origin.replace(/\/+$/, "");

  let method = "POST";
  let path = `/api/tools/${toolName}`;
  let queryParams = "";
  let body: unknown = args;

  if (toolName === "create_widget") {
    path = "/api/widgets";
    method = "POST";
  } else if (toolName === "get_widget") {
    path = "/api/widgets";
    method = "GET";
    queryParams = `?operationKey=${encodeURIComponent(String(args.operationKey || ""))}`;
    body = undefined;
  } else if (toolName === "delete_widget") {
    path = "/api/widgets";
    method = "DELETE";
  } else if (toolName === "publish_widget") {
    path = "/api/publications";
    method = "POST";
  } else if (toolName === "get_publication") {
    path = "/api/publications";
    method = "GET";
    queryParams = `?operationKey=${encodeURIComponent(String(args.operationKey || ""))}`;
    body = undefined;
  } else if (toolName === "unpublish_widget") {
    path = "/api/publications";
    method = "DELETE";
  } else if (toolName === "create_database") {
    path = "/api/database";
    method = "POST";
  } else if (toolName === "get_database") {
    path = "/api/database";
    method = "GET";
    queryParams = `?operationKey=${encodeURIComponent(String(args.operationKey || ""))}`;
    body = undefined;
  } else if (toolName === "delete_database") {
    path = "/api/database";
    method = "DELETE";
  } else if (toolName === "create_backend") {
    path = "/api/compute";
    method = "POST";
  } else if (toolName === "get_backend") {
    path = "/api/compute";
    method = "GET";
    queryParams = `?operationKey=${encodeURIComponent(String(args.operationKey || ""))}`;
    body = undefined;
  } else if (toolName === "delete_backend") {
    path = "/api/compute";
    method = "DELETE";
  } else if (toolName === "create_route") {
    path = "/api/routing";
    method = "POST";
  } else if (toolName === "get_route") {
    path = "/api/routing";
    method = "GET";
    queryParams = `?operationKey=${encodeURIComponent(String(args.operationKey || ""))}`;
    body = undefined;
  } else if (toolName === "delete_route") {
    path = "/api/routing";
    method = "DELETE";
  } else if (toolName === "deploy_frontend") {
    path = "/api/frontend";
    method = "POST";
  } else if (toolName === "get_frontend") {
    path = "/api/frontend";
    method = "GET";
    queryParams = `?operationKey=${encodeURIComponent(String(args.operationKey || ""))}`;
    body = undefined;
  } else if (toolName === "delete_frontend") {
    path = "/api/frontend";
    method = "DELETE";
  }

  const endpoint = `${normalizedOrigin}${path}${queryParams}`;

  try {
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Tool '${toolName}' failed with HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    // If failure mode is simulated transport drop
    if (args.failureMode === "drop-ack-after-commit") {
      const error = new Error("Transport acknowledgement lost after remote commit") as Error & {
        uncertainOutcome?: boolean;
      };
      error.uncertainOutcome = true;
      throw error;
    }
    throw err;
  }
}

/**
 * Runs a workflow asynchronously on the server runtime, executing steps in DAG topological order,
 * performing authoritative reconciliation on uncertainty, and updating PostgreSQL durably.
 */
export async function runWorkflowTransaction(
  transactionId: string,
  workflow: WorkflowRecord,
  runtimeInput: Record<string, unknown> = {}
): Promise<void> {
  await initCoordinatorDb();

  const client = await pool.connect();
  let nodes: ServerRunnerNode[] = [];
  try {
    const res = await client.query(
      `SELECT id, service, label, origin, execute_tool, inspect_tool, compensate_tool,
              state, operation_key, resource_id, dependencies, execute_args
       FROM transaction_nodes
       WHERE transaction_id = $1
       ORDER BY created_at ASC`,
      [transactionId]
    );

    nodes = res.rows.map((row) => ({
      id: row.id,
      service: row.service,
      label: row.label,
      origin: row.origin,
      executeTool: row.execute_tool,
      inspectTool: row.inspect_tool,
      compensateTool: row.compensate_tool,
      state: row.state,
      operationKey: row.operation_key,
      resourceId: row.resource_id,
      dependencies: Array.isArray(row.dependencies) ? row.dependencies : JSON.parse(row.dependencies || "[]"),
      executeArgs: typeof row.execute_args === "object" ? row.execute_args : JSON.parse(row.execute_args || "{}"),
    }));
  } finally {
    client.release();
  }

  const completedNodeIds = new Set<string>();
  const nodeOutputs = new Map<string, Record<string, unknown>>();

  // Populate any pre-existing completed nodes
  for (const n of nodes) {
    if (n.state === "SUCCEEDED" || n.state === "RECOVERED") {
      completedNodeIds.add(n.id);
      if (n.resourceId) {
        nodeOutputs.set(n.id, { resourceId: n.resourceId });
      }
    }
  }

  while (completedNodeIds.size < nodes.length) {
    const runnable = nodes.filter(
      (n) => n.state === "PENDING" && n.dependencies.every((dep: string) => completedNodeIds.has(dep))
    );

    if (runnable.length === 0) {
      const anyFailed = nodes.some((n) => n.state === "FAILED");
      if (anyFailed) {
        await executeAtomicTransition({
          transactionId,
          txState: "AWAITING_COMPENSATION_APPROVAL",
          eventType: "TRANSACTION_AWAITING_APPROVAL",
          eventPayload: { reason: "Downstream step failed" },
        });
        return;
      }
      break;
    }

    for (const node of runnable) {
      node.state = "EXECUTING";
      await executeAtomicTransition({
        transactionId,
        nodeId: node.id,
        nodeState: "EXECUTING",
        eventType: "NODE_EXECUTING",
        eventPayload: { label: node.label, service: node.service },
      });

      // Prepare payload
      const payload: Record<string, unknown> = {
        ...runtimeInput,
        ...node.executeArgs,
        operationKey: node.operationKey,
      };

      for (const depId of node.dependencies) {
        const out = nodeOutputs.get(depId);
        if (out?.resourceId) {
          payload.resourceId = out.resourceId;
          payload.widgetId = out.resourceId;
          if (depId.includes("database") || node.service === "compute") {
            payload.databaseResourceId = out.resourceId;
          }
          if (depId.includes("compute") || node.service === "routing") {
            payload.backendResourceId = out.resourceId;
            payload.targetUrl = `${origins.compute}/runtime/${out.resourceId}/health`;
          }
        }
      }

      try {
        const result = await dispatchServiceTool(node.origin, node.executeTool, payload);
        const resourceId = (result?.resourceId || result?.id || result?.widgetId || node.operationKey) as string;

        node.state = "SUCCEEDED";
        node.resourceId = resourceId;
        nodeOutputs.set(node.id, { resourceId, ...result });
        completedNodeIds.add(node.id);

        await executeAtomicTransition({
          transactionId,
          nodeId: node.id,
          nodeState: "SUCCEEDED",
          resourceId,
          eventType: "NODE_SUCCEEDED",
          eventPayload: { label: node.label, service: node.service, resourceId },
        });
      } catch (execErr: unknown) {
        const isUncertain =
          (execErr && typeof execErr === "object" && "uncertainOutcome" in execErr) ||
          (execErr instanceof Error && execErr.message.includes("Transport acknowledgement lost"));

        if (isUncertain) {
          node.state = "IN_DOUBT";
          await executeAtomicTransition({
            transactionId,
            nodeId: node.id,
            nodeState: "IN_DOUBT",
            eventType: "NODE_IN_DOUBT",
            eventPayload: { label: node.label, reason: "Transport acknowledgement lost after remote commit" },
          });

          await new Promise((r) => setTimeout(r, 400));

          node.state = "RECONCILING";
          await executeAtomicTransition({
            transactionId,
            nodeId: node.id,
            nodeState: "RECONCILING",
            eventType: "NODE_RECONCILING",
            eventPayload: { label: node.label, inspectTool: node.inspectTool },
          });

          try {
            const inspectResult = await dispatchServiceTool(node.origin, node.inspectTool, {
              operationKey: node.operationKey,
            });

            if (inspectResult?.exists) {
              const resId = (inspectResult.resourceId || inspectResult.id || node.operationKey) as string;
              node.state = "RECOVERED";
              node.resourceId = resId;
              nodeOutputs.set(node.id, { resourceId: resId, ...inspectResult });
              completedNodeIds.add(node.id);

              await executeAtomicTransition({
                transactionId,
                nodeId: node.id,
                nodeState: "RECOVERED",
                resourceId: resId,
                eventType: "NODE_RECOVERED",
                eventPayload: { label: node.label, service: node.service, resourceId: resId },
              });
              continue;
            }
          } catch {
            // Reconcile inspection failed
          }
        }

        // Clean failure
        const errorMsg = execErr instanceof Error ? execErr.message : String(execErr);
        node.state = "FAILED";
        await executeAtomicTransition({
          transactionId,
          nodeId: node.id,
          nodeState: "FAILED",
          lastError: errorMsg,
          txState: "AWAITING_COMPENSATION_APPROVAL",
          eventType: "NODE_FAILED",
          eventPayload: { label: node.label, error: errorMsg },
        });
        return;
      }
    }
  }

  await executeAtomicTransition({
    transactionId,
    txState: "COMMITTED",
    eventType: "TRANSACTION_COMMITTED",
    eventPayload: { workflowName: workflow.name },
  });
}

/**
 * Compensates completed nodes in reverse topological order.
 */
export async function compensateTransaction(
  transactionId: string,
  reason = "Compensating transaction following policy approval"
): Promise<void> {
  await initCoordinatorDb();

  await executeAtomicTransition({
    transactionId,
    txState: "COMPENSATING",
    eventType: "TRANSACTION_COMPENSATING",
    eventPayload: { reason },
  });

  const client = await pool.connect();
  let nodes: ServerRunnerNode[] = [];
  try {
    const res = await client.query(
      `SELECT id, service, label, origin, execute_tool, inspect_tool, compensate_tool,
              state, operation_key, resource_id, dependencies, execute_args
       FROM transaction_nodes
       WHERE transaction_id = $1
       ORDER BY created_at ASC`,
      [transactionId]
    );

    nodes = res.rows.map((row) => ({
      id: row.id,
      service: row.service,
      label: row.label,
      origin: row.origin,
      executeTool: row.execute_tool,
      inspectTool: row.inspect_tool,
      compensateTool: row.compensate_tool,
      state: row.state,
      operationKey: row.operation_key,
      resourceId: row.resource_id,
      dependencies: Array.isArray(row.dependencies) ? row.dependencies : JSON.parse(row.dependencies || "[]"),
      executeArgs: typeof row.execute_args === "object" ? row.execute_args : JSON.parse(row.execute_args || "{}"),
    }));
  } finally {
    client.release();
  }

  const completedNodes = nodes
    .filter((n) => n.state === "SUCCEEDED" || n.state === "RECOVERED")
    .reverse();

  for (const node of completedNodes) {
    if (!node.compensateTool) continue;

    await executeAtomicTransition({
      transactionId,
      nodeId: node.id,
      nodeState: "COMPENSATING",
      eventType: "NODE_COMPENSATING",
      eventPayload: { label: node.label, tool: node.compensateTool },
    });

    try {
      await dispatchServiceTool(node.origin, node.compensateTool, {
        operationKey: node.operationKey,
        resourceId: node.resourceId,
      });
    } catch (err) {
      console.warn(`[mcpx-server] error compensating node ${node.label}:`, err);
    }

    await executeAtomicTransition({
      transactionId,
      nodeId: node.id,
      nodeState: "COMPENSATED",
      eventType: "NODE_COMPENSATED",
      eventPayload: { label: node.label, tool: node.compensateTool },
    });
  }

  await executeAtomicTransition({
    transactionId,
    txState: "COMPENSATED",
    eventType: "TRANSACTION_COMPENSATED",
    eventPayload: { reason },
  });
}
