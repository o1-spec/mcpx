import type { RegisteredTool } from "@/types/webmcp";
import type { TransactionNode, ExecutionResult } from "./types";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";
import { getServiceContract } from "./contracts";

/**
 * Executes a single TransactionNode generically through WebMCP
 * Classifies outcome into:
 * - SUCCEEDED: confirmed successful write
 * - IN_DOUBT: uncertain transport failure after write dispatch
 * - FAILED: confirmed clean rejection prior to commit
 */
export async function executeNode(
  node: TransactionNode,
  tools: RegisteredTool[]
): Promise<ExecutionResult> {
  if (typeof document === "undefined" || !document.modelContext) {
    const error = "document.modelContext unavailable in current browser context";
    return {
      outcome: "FAILED",
      updatedNode: { ...node, state: "FAILED", lastError: error },
      error,
    };
  }

  const tool = tools.find((t) => t.name === node.executeTool);
  if (!tool) {
    const error = `Tool '${node.executeTool}' required for service '${node.service}' was not discovered`;
    return {
      outcome: "FAILED",
      updatedNode: { ...node, state: "FAILED", lastError: error },
      error,
    };
  }

  console.log(`[transaction-engine] [execute] executing ${node.executeTool} for node ${node.id}...`, {
    operationKey: node.operationKey,
    args: node.executeArgs,
  });

  try {
    const rawResult = await document.modelContext.executeTool(
      tool,
      JSON.stringify(node.executeArgs)
    );

    const normalizedResult = normalizeWebMCPResult(rawResult);

    // Extract resourceId if available
    let resourceId: string | undefined;
    try {
      const contract = getServiceContract(node.service);
      if (contract.extractResourceId) {
        resourceId = contract.extractResourceId(normalizedResult);
      }
    } catch {
      // Contract lookup optional
    }

    console.log(`[transaction-engine] [execute] ${node.id} SUCCEEDED`, {
      resourceId,
      normalizedResult,
    });

    return {
      outcome: "SUCCEEDED",
      updatedNode: {
        ...node,
        state: "SUCCEEDED",
        resourceId: resourceId ?? node.resourceId,
        lastError: undefined,
      },
      rawResult,
      normalizedResult,
      resourceId,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errName = err && typeof err === "object" && "name" in err ? String(err.name) : "";

    // Classify: Uncertain Transport Failure vs Confirmed Rejection
    const isUncertainFailure =
      errName === "NetworkError" ||
      errMsg.includes("ERR_CONNECTION_RESET") ||
      errMsg.includes("Simulated transport acknowledgement loss") ||
      node.executeArgs.failureMode === "drop-ack-after-commit";

    if (isUncertainFailure) {
      console.warn(`[transaction-engine] [execute] ${node.id} IN_DOUBT (uncertain transport):`, errMsg);
      return {
        outcome: "IN_DOUBT",
        updatedNode: {
          ...node,
          state: "IN_DOUBT",
          lastError: errMsg,
        },
        error: errMsg,
      };
    }

    // Confirmed clean rejection (e.g. reject-before-commit or validation error)
    console.warn(`[transaction-engine] [execute] ${node.id} FAILED (confirmed rejection):`, errMsg);
    return {
      outcome: "FAILED",
      updatedNode: {
        ...node,
        state: "FAILED",
        lastError: errMsg,
      },
      error: errMsg,
    };
  }
}
