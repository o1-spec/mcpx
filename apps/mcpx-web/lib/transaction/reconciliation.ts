import type { RegisteredTool } from "@/types/webmcp";
import type { TransactionNode, ReconciliationResult } from "./types";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";
import { getServiceContract } from "./contracts";

/**
 * Performs generic authoritative inspection for a node in IN_DOUBT / RECONCILING
 * Using node.inspectTool through WebMCP with the EXACT SAME operationKey
 */
export async function reconcileNode(
  node: TransactionNode,
  tools: RegisteredTool[]
): Promise<ReconciliationResult> {
  if (typeof document === "undefined" || !document.modelContext) {
    const error = "document.modelContext unavailable";
    return {
      outcome: "UNINTERPRETABLE",
      updatedNode: { ...node, state: "RECONCILING", lastError: error },
      error,
    };
  }

  let tool = tools.find((t) => t.name === node.inspectTool);
  if (!tool && document.modelContext && typeof document.modelContext.getTools === "function") {
    try {
      const refreshedTools = await document.modelContext.getTools();
      tool = refreshedTools.find((t) => t.name === node.inspectTool);
    } catch {
      // ignore
    }
  }

  if (!tool) {
    const error = `Inspection tool '${node.inspectTool}' not discovered`;
    return {
      outcome: "UNINTERPRETABLE",
      updatedNode: { ...node, state: "RECONCILING", lastError: error },
      error,
    };
  }

  console.log(`[transaction-engine] [reconcile] inspecting node ${node.id} with ${node.inspectTool}`, {
    operationKey: node.operationKey,
  });

  try {
    const rawResult = await document.modelContext.executeTool(
      tool,
      JSON.stringify({ operationKey: node.operationKey })
    );

    const normalized = normalizeWebMCPResult(rawResult);

    const inspection =
      normalized && typeof normalized === "object"
        ? (normalized as {
            exists?: boolean;
            route?: { id?: string; [key: string]: unknown };
            database?: { id?: string; [key: string]: unknown };
            [key: string]: unknown;
          })
        : null;

    if (inspection?.exists === true) {
      let resourceId =
        (inspection.resourceId as string | undefined) ??
        (inspection.id as string | undefined) ??
        (inspection.widgetId as string | undefined) ??
        node.resourceId;

      try {
        const contract = getServiceContract(node.service);
        if (contract.extractResourceId) {
          resourceId = contract.extractResourceId(inspection) ?? resourceId;
        }
      } catch {
        resourceId = inspection.route?.id ?? inspection.database?.id ?? resourceId;
      }

      console.log(`[transaction-engine] [reconcile] ${node.id} RECOVERED (resource exists)`, {
        resourceId,
      });

      return {
        outcome: "RECOVERED",
        updatedNode: {
          ...node,
          state: "RECOVERED",
          resourceId,
          lastError: undefined,
        },
        rawResult,
        normalizedResult: normalized,
        resource: inspection.route ?? inspection.database ?? inspection,
        resourceId,
      };
    }

    if (inspection?.exists === false) {
      console.warn(`[transaction-engine] [reconcile] ${node.id} ABSENT (confirmed no resource in store)`);
      return {
        outcome: "ABSENT",
        updatedNode: {
          ...node,
          state: "FAILED",
          lastError: "Authoritative inspection found no resource.",
        },
        rawResult,
        normalizedResult: normalized,
      };
    }

    // Uninterpretable / malformed -> uncertainty remains UNKNOWN
    console.warn(`[transaction-engine] [reconcile] ${node.id} UNINTERPRETABLE result:`, normalized);
    return {
      outcome: "UNINTERPRETABLE",
      updatedNode: {
        ...node,
        state: "RECONCILING",
        lastError: "Inspection result could not be interpreted.",
      },
      rawResult,
      normalizedResult: normalized,
      error: "Inspection result could not be interpreted",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[transaction-engine] [reconcile] ${node.id} inspectTool call failed:`, err);
    return {
      outcome: "UNINTERPRETABLE",
      updatedNode: {
        ...node,
        state: "RECONCILING",
        lastError: `Inspection failed: ${errorMsg}`,
      },
      error: errorMsg,
    };
  }
}
