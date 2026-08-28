import type { Transaction, TransactionNode } from "./types";
import { getServiceContract } from "./contracts";
import { origins } from "@/lib/config/origins";

/**
 * Returns all nodes ready to execute:
 * - state is PENDING
 * - every dependency has completed successfully (state is SUCCEEDED or RECOVERED)
 */
export function getRunnableNodes(transaction: Transaction): TransactionNode[] {
  const nodeMap = new Map<string, TransactionNode>(
    transaction.nodes.map((n) => [n.id, n])
  );

  return transaction.nodes.filter((node) => {
    if (node.state !== "PENDING") return false;

    // Check all dependencies
    for (const depId of node.dependencies) {
      const depNode = nodeMap.get(depId);
      if (!depNode) return false;
      if (depNode.state !== "SUCCEEDED" && depNode.state !== "RECOVERED") {
        return false;
      }
    }

    return true;
  });
}

/**
 * Resolves dynamic execution arguments from upstream dependency outputs
 */
export function resolveExecuteArgs(
  node: TransactionNode,
  context: Transaction | TransactionNode[]
): Record<string, unknown> {
  const nodes = Array.isArray(context) ? context : context.nodes;
  const nodeMap = new Map<string, TransactionNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const resolved: Record<string, unknown> = { ...node.executeArgs };

  for (const depId of node.dependencies) {
    const depNode = nodeMap.get(depId);
    if (!depNode || !depNode.resourceId) continue;

    if (depNode.service === "database" && !resolved.databaseResourceId) {
      resolved.databaseResourceId = depNode.resourceId;
    } else if (depNode.service === "compute" && !resolved.backendResourceId) {
      resolved.backendResourceId = depNode.resourceId;
      if (node.service === "routing" && (!resolved.targetUrl || resolved.targetUrl === "http://localhost:4000")) {
        resolved.targetUrl = `${origins.compute}/runtime/${depNode.resourceId}/health`;
      }
    }
  }

  return resolved;
}

/**
 * Returns all completed nodes that require compensation,
 * sorted in REVERSE dependency / topological order (dependents compensate before dependencies).
 */
export function getCompensableNodes(transaction: Transaction): TransactionNode[] {
  const completedNodes = transaction.nodes.filter(
    (n) => n.state === "SUCCEEDED" || n.state === "RECOVERED"
  );

  if (completedNodes.length <= 1) {
    return completedNodes;
  }

  const nodeMap = new Map<string, TransactionNode>(
    transaction.nodes.map((n) => [n.id, n])
  );

  // Compute dependency depth for each node
  const depthCache = new Map<string, number>();

  function getDepth(nodeId: string, visited = new Set<string>()): number {
    if (depthCache.has(nodeId)) return depthCache.get(nodeId)!;
    if (visited.has(nodeId)) return 0; // cycle guard

    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node || node.dependencies.length === 0) {
      depthCache.set(nodeId, 0);
      return 0;
    }

    let maxDepDepth = 0;
    for (const dep of node.dependencies) {
      maxDepDepth = Math.max(maxDepDepth, 1 + getDepth(dep, new Set(visited)));
    }

    depthCache.set(nodeId, maxDepDepth);
    return maxDepDepth;
  }

  // Sort descending by depth: deepest dependents come first
  return [...completedNodes].sort((a, b) => getDepth(b.id) - getDepth(a.id));
}

/**
 * Declaratively creates a TransactionNode using the service contract registry
 */
export function createTransactionNode(params: {
  service: string;
  id: string;
  label: string;
  operationKey: string;
  dependencies?: string[];
  executeArgs: Record<string, unknown>;
}): TransactionNode {
  const contract = getServiceContract(params.service);

  return {
    id: params.id,
    label: params.label,
    service: params.service,
    origin: contract.origin,
    executeTool: contract.executeTool,
    inspectTool: contract.inspectTool,
    compensateTool: contract.compensateTool,
    operationKey: params.operationKey,
    dependencies: params.dependencies ?? [],
    state: "PENDING",
    executeArgs: params.executeArgs,
  };
}
