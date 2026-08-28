import type { RegisteredTool } from "@/types/webmcp";
import type { TransactionNode, CompensationResult } from "./types";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";

/**
 * Compensates a completed node generically through WebMCP:
 * 1. Calls node.compensateTool
 * 2. Calls node.inspectTool to authoritatively verify that exists === false
 * 3. Only marks COMPENSATED upon verified removal
 */
export async function compensateNode(
  node: TransactionNode,
  tools: RegisteredTool[]
): Promise<CompensationResult> {
  if (typeof document === "undefined" || !document.modelContext) {
    const error = "document.modelContext unavailable";
    return {
      outcome: "FAILED",
      updatedNode: { ...node, state: "FAILED", lastError: error },
      error,
    };
  }

  const compTool = tools.find((t) => t.name === node.compensateTool);
  const inspTool = tools.find((t) => t.name === node.inspectTool);

  if (!compTool || !inspTool) {
    const error = `Tools required for compensation (${node.compensateTool}, ${node.inspectTool}) not discovered`;
    return {
      outcome: "FAILED",
      updatedNode: { ...node, state: "FAILED", lastError: error },
      error,
    };
  }

  console.log("[mcpx-web] compensating node", {
    nodeId: node.id,
    service: node.service,
    compensateTool: compTool.name,
    inspectTool: inspTool.name,
    operationKey: node.operationKey,
  });

  try {
    // 1. Invoke compensateTool
    const rawDelete = await document.modelContext.executeTool(
      compTool,
      JSON.stringify({ operationKey: node.operationKey })
    );
    console.log(`[mcpx-web] ${node.compensateTool} raw result:`, rawDelete);

    // 2. Authoritative verification via inspectTool
    const rawInspect = await document.modelContext.executeTool(
      inspTool,
      JSON.stringify({ operationKey: node.operationKey })
    );
    const normalizedInspect = normalizeWebMCPResult(rawInspect) as { exists?: boolean };

    console.log(`[mcpx-web] post-compensation ${node.inspectTool} raw:`, rawInspect);
    console.log(`[mcpx-web] post-compensation ${node.inspectTool} normalized:`, normalizedInspect);

    if (normalizedInspect && normalizedInspect.exists === false) {
      console.log(`[mcpx-web] ${node.id} COMPENSATED (resource confirmed absent)`);
      return {
        outcome: "COMPENSATED",
        updatedNode: {
          ...node,
          state: "COMPENSATED",
          resourceId: undefined,
          lastError: undefined,
        },
      };
    }

    const error = `Authoritative verification found ${node.service} resource still present after compensation (exists: ${normalizedInspect?.exists})`;
    console.error(`[mcpx-web] ${node.id} FAILED:`, error);
    return {
      outcome: "FAILED",
      updatedNode: {
        ...node,
        state: "MANUAL_ATTENTION_REQUIRED",
        lastError: error,
      },
      error,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[mcpx-web] ${node.id} compensation execution failed:`, err);
    return {
      outcome: "FAILED",
      updatedNode: {
        ...node,
        state: "MANUAL_ATTENTION_REQUIRED",
        lastError: `Compensation error: ${errorMsg}`,
      },
      error: errorMsg,
    };
  }
}
