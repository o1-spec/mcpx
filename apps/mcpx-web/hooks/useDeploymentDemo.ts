"use client";

import { useState, useCallback, RefObject } from "react";
import type { RegisteredTool } from "@/types/webmcp";
import type { TransactionEvent } from "@/types/reliability";
import {
  Transaction,
  createTransactionNode,
  getRunnableNodes,
  resolveExecuteArgs,
  executeNode,
} from "@/lib/transaction";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";

export interface FourServiceAuthoritativeState {
  database?: { id: string; name: string; operationKey: string; createdAt?: string };
  backend?: { id: string; projectName: string; databaseResourceId: string; healthUrl: string; operationKey: string };
  routing?: { id: string; projectName: string; targetUrl: string; operationKey: string };
  frontend?: { id: string; projectName: string; backendResourceId: string; previewUrl: string; operationKey: string };
}

export function useDeploymentDemo(registeredToolsRef: RefObject<RegisteredTool[]>) {
  const [isRunning, setIsRunning] = useState(false);

  const createInitialDAG = (txId = "tx:demo-init"): Transaction => {
    return {
      id: txId,
      state: "CREATED",
      nodes: [
        createTransactionNode({
          service: "database",
          id: "database:create",
          label: "Database Service (create_database)",
          operationKey: `${txId}:database:create`,
          dependencies: [],
          executeArgs: {
            name: "mcpx-prod-db",
            operationKey: `${txId}:database:create`,
          },
        }),
        createTransactionNode({
          service: "compute",
          id: "backend:deploy",
          label: "Compute Service (deploy_backend)",
          operationKey: `${txId}:backend:deploy`,
          dependencies: ["database:create"],
          executeArgs: {
            projectName: "mcpx-demo",
            operationKey: `${txId}:backend:deploy`,
          },
        }),
        createTransactionNode({
          service: "routing",
          id: "routing:create",
          label: "Routing Service (create_route)",
          operationKey: `${txId}:routing:create`,
          dependencies: ["backend:deploy"],
          executeArgs: {
            projectName: "mcpx-demo",
            operationKey: `${txId}:routing:create`,
            failureMode: "none",
          },
        }),
        createTransactionNode({
          service: "frontend",
          id: "frontend:deploy",
          label: "Frontend Service (deploy_frontend)",
          operationKey: `${txId}:frontend:deploy`,
          dependencies: ["backend:deploy"],
          executeArgs: {
            projectName: "mcpx-demo",
            operationKey: `${txId}:frontend:deploy`,
          },
        }),
      ],
    };
  };

  const [transaction, setTransaction] = useState<Transaction>(createInitialDAG());
  const [eventLog, setEventLog] = useState<TransactionEvent[]>([]);
  const [authoritativeState, setAuthoritativeState] = useState<FourServiceAuthoritativeState>({});

  const appendEvent = useCallback(
    (type: string, details?: Record<string, unknown>) => {
      const newEvent: TransactionEvent = {
        id: crypto.randomUUID(),
        type,
        timestamp: new Date().toISOString(),
        details,
      };
      setEventLog((prev) => [...prev, newEvent]);
      console.log(`[mcpx-dag-event] ${type}`, details ?? "");
    },
    []
  );

  const runDeployment = async () => {
    if (typeof document === "undefined" || !document.modelContext) {
      alert("document.modelContext is not available in this browser.");
      return;
    }

    setIsRunning(true);
    setEventLog([]);
    setAuthoritativeState({});

    const txId = `tx:demo-${Date.now()}`;
    let currentTx = createInitialDAG(txId);
    currentTx.state = "EXECUTING";

    setTransaction(currentTx);
    appendEvent("TX_CREATED", {
      transactionId: txId,
      topology: "DATABASE -> BACKEND -> (ROUTING, FRONTEND)",
      totalNodes: 4,
    });

    // Generic scheduler loop: processes DAG dynamically
    while (true) {
      const runnableNodes = getRunnableNodes(currentTx);
      if (runnableNodes.length === 0) {
        // Check if all nodes succeeded
        const allCompleted = currentTx.nodes.every(
          (n) => n.state === "SUCCEEDED" || n.state === "RECOVERED"
        );
        if (allCompleted) {
          currentTx = { ...currentTx, state: "COMMITTED" };
          setTransaction(currentTx);
          appendEvent("TX_COMMITTED", {
            transactionId: txId,
            status: "All 4 microservices deployed and bound successfully via WebMCP.",
          });
        }
        break;
      }

      // Execute each runnable node
      for (const node of runnableNodes) {
        // Resolve dynamic arguments from upstream dependencies
        const resolvedArgs = resolveExecuteArgs(node, currentTx);
        const nodeToExecute = { ...node, executeArgs: resolvedArgs };

        // Mark EXECUTING
        currentTx = {
          ...currentTx,
          nodes: currentTx.nodes.map((n) =>
            n.id === node.id ? { ...n, state: "EXECUTING" } : n
          ),
        };
        setTransaction(currentTx);

        appendEvent(`${node.service.toUpperCase()}_EXECUTE_STARTED`, {
          operationKey: node.operationKey,
          resolvedArgs,
        });

        const execResult = await executeNode(nodeToExecute, registeredToolsRef.current);

        currentTx = {
          ...currentTx,
          nodes: currentTx.nodes.map((n) =>
            n.id === node.id ? execResult.updatedNode : n
          ),
        };
        setTransaction(currentTx);

        if (execResult.outcome === "SUCCEEDED") {
          appendEvent(`${node.service.toUpperCase()}_EXECUTE_SUCCEEDED`, {
            operationKey: node.operationKey,
            resourceId: execResult.resourceId,
          });

          // Update local authoritative tracking
          if (node.service === "database" && execResult.resourceId) {
            setAuthoritativeState((prev) => ({
              ...prev,
              database: {
                id: execResult.resourceId!,
                name: "mcpx-prod-db",
                operationKey: node.operationKey,
              },
            }));
          } else if (node.service === "compute" && execResult.resourceId) {
            setAuthoritativeState((prev) => ({
              ...prev,
              backend: {
                id: execResult.resourceId!,
                projectName: "mcpx-demo",
                databaseResourceId: String(resolvedArgs.databaseResourceId || ""),
                healthUrl: `http://localhost:3003/health/mcpx-demo`,
                operationKey: node.operationKey,
              },
            }));
          } else if (node.service === "routing" && execResult.resourceId) {
            setAuthoritativeState((prev) => ({
              ...prev,
              routing: {
                id: execResult.resourceId!,
                projectName: "mcpx-demo",
                targetUrl: String(resolvedArgs.targetUrl || "http://localhost:4000"),
                operationKey: node.operationKey,
              },
            }));
          } else if (node.service === "frontend" && execResult.resourceId) {
            setAuthoritativeState((prev) => ({
              ...prev,
              frontend: {
                id: execResult.resourceId!,
                projectName: "mcpx-demo",
                backendResourceId: String(resolvedArgs.backendResourceId || ""),
                previewUrl: `http://localhost:3004/preview/mcpx-demo`,
                operationKey: node.operationKey,
              },
            }));
          }
        } else {
          appendEvent(`${node.service.toUpperCase()}_EXECUTE_FAILED`, {
            operationKey: node.operationKey,
            error: execResult.error,
          });
          currentTx = {
            ...currentTx,
            state: "FAILED",
            lastError: `Node ${node.id} failed: ${execResult.error}`,
          };
          setTransaction(currentTx);
          setIsRunning(false);
          return;
        }
      }
    }

    setIsRunning(false);
  };

  const inspectAllResources = async () => {
    if (typeof document === "undefined" || !document.modelContext) return;

    for (const node of transaction.nodes) {
      const inspectTool = registeredToolsRef.current.find((t) => t.name === node.inspectTool);
      if (!inspectTool) continue;

      try {
        const raw = await document.modelContext.executeTool(
          inspectTool,
          JSON.stringify({ operationKey: node.operationKey })
        );
        const normalized = normalizeWebMCPResult(raw);
        console.log(`[mcpx-dag] authoritative inspection for ${node.id}:`, normalized);
      } catch (err) {
        console.error(`[mcpx-dag] inspect ${node.id} failed:`, err);
      }
    }
  };

  const resetDeployment = () => {
    setTransaction(createInitialDAG());
    setEventLog([]);
    setAuthoritativeState({});
  };

  return {
    transaction,
    isRunning,
    eventLog,
    authoritativeState,
    runDeployment,
    inspectAllResources,
    resetDeployment,
    clearEventLog: () => setEventLog([]),
  };
}
