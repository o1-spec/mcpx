import type { RegisteredTool } from "@/types/webmcp";
import type { TransactionNode, ExecutionResult } from "./types";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";
import { getServiceContract } from "./contracts";

export class UncertainOutcomeError extends Error {
  readonly uncertainOutcome = true;
  constructor(message: string) {
    super(message);
    this.name = "UncertainOutcomeError";
  }
}

/**
 * Executes a single TransactionNode generically through WebMCP
 * Classifies outcome strictly:
 * - SUCCEEDED: confirmed successful write
 * - IN_DOUBT: explicit uncertain transport loss after mutation dispatch
 * - FAILED: confirmed clean rejection prior to commit, or execution/schema/security error
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

  let tool = tools.find((t) => t.name === node.executeTool);
  if (!tool && document.modelContext && typeof document.modelContext.getTools === "function") {
    try {
      const refreshedTools = await document.modelContext.getTools();
      tool = refreshedTools.find((t) => t.name === node.executeTool);
    } catch {
      // ignore
    }
  }

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

    let resourceId: string | undefined;
    if (normalizedResult && typeof normalizedResult === "object") {
      const obj = normalizedResult as Record<string, unknown>;
      if (typeof obj.resourceId === "string") resourceId = obj.resourceId;
      else if (typeof obj.id === "string") resourceId = obj.id;
      else if (typeof obj.widgetId === "string") resourceId = obj.widgetId;
    }

    if (!resourceId) {
      try {
        const contract = getServiceContract(node.service);
        if (contract.extractResourceId) {
          resourceId = contract.extractResourceId(normalizedResult);
        }
      } catch {
        // Contract lookup optional
      }
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

    // Classify: Explicit Uncertain Transport Loss vs Confirmed Rejection
    // Only classify as IN_DOUBT when there is explicit evidence of post-dispatch transport ACK drop
    const isExplicitUncertainty =
      (err && typeof err === "object" && "uncertainOutcome" in err && (err as { uncertainOutcome: boolean }).uncertainOutcome === true) ||
      (errName === "NetworkError" && errMsg.includes("ERR_CONNECTION_RESET")) ||
      errMsg.includes("Simulated transport acknowledgement loss") ||
      node.executeArgs.failureMode === "drop-ack-after-commit";

    if (isExplicitUncertainty) {
      console.warn(`[transaction-engine] [execute] ${node.id} IN_DOUBT (explicit uncertain transport):`, errMsg);
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

    // All other errors (REJECTED_BEFORE_COMMIT, SecurityError, TypeError, SchemaFailure) are clean failures
    console.warn(`[transaction-engine] [execute] ${node.id} FAILED (confirmed failure / rejection):`, errMsg);
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
