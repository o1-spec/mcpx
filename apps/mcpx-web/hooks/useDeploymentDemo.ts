"use client";

import { useState, useCallback, RefObject } from "react";
import type { RegisteredTool } from "@/types/webmcp";
import type { TransactionEvent } from "@/types/reliability";
import {
  Transaction,
  createTransactionNode,
  getRunnableNodes,
  getCompensableNodes,
  resolveExecuteArgs,
  executeNode,
  reconcileNode,
  compensateNode,
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

  const createInitialDAG = (txId = "tx:demo-init", failureScenario = false): Transaction => {
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
            failureMode: failureScenario ? "drop-ack-after-commit" : "none",
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
            failureMode: failureScenario ? "reject-before-commit" : "none",
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

  const runDeployment = async (failureScenario = false) => {
    if (typeof document === "undefined" || !document.modelContext) {
      alert("document.modelContext is not available in this browser.");
      return;
    }

    setIsRunning(true);
    setEventLog([]);
    setAuthoritativeState({});

    const txId = `tx:demo-${Date.now()}`;
    let currentTx = createInitialDAG(txId, failureScenario);
    currentTx.state = "EXECUTING";

    setTransaction(currentTx);
    appendEvent("TX_CREATED", {
      transactionId: txId,
      scenario: failureScenario
        ? "COMBINED_CHALLENGE (Routing drop-ack -> Recover, Frontend reject -> Reverse Compensate 3 services)"
        : "HAPPY_PATH_ALL_4_SERVICES",
      totalNodes: 4,
    });

    // Generic scheduler loop: executes runnable DAG nodes dynamically
    while (true) {
      const runnableNodes = getRunnableNodes(currentTx);
      if (runnableNodes.length === 0) {
        // Check if all nodes completed successfully
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
          ...(nodeToExecute.executeArgs.failureMode ? { failureMode: nodeToExecute.executeArgs.failureMode } : {}),
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
        } else if (execResult.outcome === "IN_DOUBT") {
          // Transport loss -> IN_DOUBT -> Authoritative Reconciliation
          appendEvent(`${node.service.toUpperCase()}_EXECUTE_UNCERTAIN`, {
            error: execResult.error,
            reason: "Transport ACK lost after mutation dispatch. Transitioning to IN_DOUBT.",
          });
          appendEvent(`${node.service.toUpperCase()}_MARKED_IN_DOUBT`, {
            operationKey: node.operationKey,
          });

          // Transition to RECONCILING
          currentTx = {
            ...currentTx,
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? { ...n, state: "RECONCILING" } : n
            ),
          };
          setTransaction(currentTx);
          appendEvent(`${node.service.toUpperCase()}_RECONCILIATION_STARTED`, {
            operationKey: node.operationKey,
            inspectTool: node.inspectTool,
          });

          // Execute generic authoritative inspection
          const reconcileResult = await reconcileNode(
            execResult.updatedNode,
            registeredToolsRef.current
          );

          currentTx = {
            ...currentTx,
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? reconcileResult.updatedNode : n
            ),
          };
          setTransaction(currentTx);

          if (reconcileResult.outcome === "RECOVERED") {
            appendEvent(`${node.service.toUpperCase()}_REMOTE_STATE_FOUND`, {
              operationKey: node.operationKey,
              resourceId: reconcileResult.resourceId,
            });
            appendEvent(`${node.service.toUpperCase()}_RECOVERED`, {
              operationKey: node.operationKey,
              resourceId: reconcileResult.resourceId,
              outcome: "Resource verified in store prior to ACK drop; state recovered.",
            });

            if (node.service === "routing" && reconcileResult.resourceId) {
              setAuthoritativeState((prev) => ({
                ...prev,
                routing: {
                  id: reconcileResult.resourceId!,
                  projectName: "mcpx-demo",
                  targetUrl: String(resolvedArgs.targetUrl || "http://localhost:4000"),
                  operationKey: node.operationKey,
                },
              }));
            }
          } else {
            appendEvent(`${node.service.toUpperCase()}_RECONCILIATION_FAILED`, {
              operationKey: node.operationKey,
              error: reconcileResult.error,
            });
            currentTx = { ...currentTx, state: "FAILED" };
            setTransaction(currentTx);
            setIsRunning(false);
            return;
          }
        } else {
          // Confirmed clean failure (e.g. reject-before-commit)
          appendEvent(`${node.service.toUpperCase()}_EXECUTE_FAILED`, {
            operationKey: node.operationKey,
            error: execResult.error,
            note: "Confirmed clean failure before commit",
          });

          // Transaction Aborts
          currentTx = { ...currentTx, state: "ABORTING" };
          setTransaction(currentTx);
          appendEvent("TX_ABORT_STARTED", {
            reason: `Downstream node ${node.id} failed with confirmed rejection`,
          });

          // Calculate completed nodes in reverse dependency order
          const compensable = getCompensableNodes(currentTx);
          if (compensable.length > 0) {
            currentTx = { ...currentTx, state: "AWAITING_COMPENSATION_APPROVAL" };
            setTransaction(currentTx);
            appendEvent("COMPENSATION_APPROVAL_REQUIRED", {
              compensableNodes: compensable.map((c) => c.id),
              resourceIds: compensable.map((c) => `${c.service}: ${c.resourceId}`),
              prompt: `Downstream node failed. ${compensable.length} previously-created resources must be removed in reverse dependency order (${compensable.map((c) => c.service).join(" → ")}).`,
            });
          } else {
            currentTx = { ...currentTx, state: "FAILED" };
            setTransaction(currentTx);
          }

          setIsRunning(false);
          return;
        }
      }
    }

    setIsRunning(false);
  };

  const approveCompensation = async () => {
    if (typeof document === "undefined" || !document.modelContext) return;

    setIsRunning(true);

    // Compute completed nodes in REVERSE dependency / topological order
    const compensableNodes = getCompensableNodes(transaction);

    let currentTx: Transaction = {
      ...transaction,
      state: "COMPENSATING",
      nodes: transaction.nodes.map((n) =>
        compensableNodes.some((c) => c.id === n.id) ? { ...n, state: "COMPENSATING" } : n
      ),
    };
    setTransaction(currentTx);

    appendEvent("COMPENSATION_APPROVED", { byUser: true });

    for (const compNode of compensableNodes) {
      appendEvent(`${compNode.service.toUpperCase()}_COMPENSATION_STARTED`, {
        operationKey: compNode.operationKey,
        resourceId: compNode.resourceId,
        service: compNode.service,
      });

      const compResult = await compensateNode(compNode, registeredToolsRef.current);

      if (compResult.outcome === "COMPENSATED") {
        appendEvent(`${compNode.service.toUpperCase()}_COMPENSATION_SUCCEEDED`, {
          operationKey: compNode.operationKey,
        });
        appendEvent(`${compNode.service.toUpperCase()}_COMPENSATION_VERIFIED`, {
          operationKey: compNode.operationKey,
          exists: false,
          verifiedOutcome: "Resource successfully absent from store",
        });

        currentTx = {
          ...currentTx,
          nodes: currentTx.nodes.map((n) =>
            n.id === compNode.id ? compResult.updatedNode : n
          ),
        };
        setTransaction(currentTx);

        // Update local authoritative tracking correctly for backend/compute
        if (compNode.service === "compute") {
          setAuthoritativeState((prev) => ({
            ...prev,
            backend: undefined,
          }));
        } else {
          setAuthoritativeState((prev) => ({
            ...prev,
            [compNode.service]: undefined,
          }));
        }
      } else {
        currentTx = {
          ...currentTx,
          state: "MANUAL_ATTENTION_REQUIRED",
          lastError: compResult.error,
        };
        setTransaction(currentTx);
        appendEvent("COMPENSATION_FAILED", { error: compResult.error });
        setIsRunning(false);
        return;
      }
    }

    // Final Transaction-Level Verification Sweep:
    // Verify all 4 resources are authoritatively absent via WebMCP inspection
    let anyResourceRemains = false;
    for (const node of currentTx.nodes) {
      const inspTool = registeredToolsRef.current.find((t) => t.name === node.inspectTool);
      if (!inspTool) continue;

      try {
        const raw = await document.modelContext.executeTool(
          inspTool,
          JSON.stringify({ operationKey: node.operationKey })
        );
        const norm = normalizeWebMCPResult(raw) as { exists?: boolean };
        console.log(`[mcpx-web] final sweep inspection for ${node.id}:`, norm);
        if (norm?.exists === true) {
          anyResourceRemains = true;
          console.error(`[mcpx-web] final sweep found resource still present for ${node.id}`);
        }
      } catch (err) {
        console.error(`[mcpx-web] final sweep error for ${node.id}:`, err);
      }
    }

    if (anyResourceRemains) {
      currentTx = {
        ...currentTx,
        state: "MANUAL_ATTENTION_REQUIRED",
        lastError: "Resource still exists in microservice store after compensation.",
      };
      setTransaction(currentTx);
      appendEvent("TRANSACTION_COMPENSATION_INCOMPLETE", {
        reason: "One or more resources remained present during final authoritative verification sweep.",
      });
    } else {
      currentTx = { ...currentTx, state: "COMPENSATED" };
      setTransaction(currentTx);
      setAuthoritativeState({});
      appendEvent("TX_COMPENSATED", {
        transactionId: currentTx.id,
        status: "All previously created resources were successfully rolled back and authoritatively verified absent in reverse order.",
      });
    }

    setIsRunning(false);
  };

  const rejectCompensation = () => {
    setTransaction((prev) => ({
      ...prev,
      state: "FAILED",
      lastError: "Compensation rejected by operator. Resources retained in current state.",
    }));
    appendEvent("COMPENSATION_REJECTED_MANUAL_ATTENTION", {
      retainedResources: getCompensableNodes(transaction).map((c) => c.id),
    });
  };

  const inspectAllResources = async () => {
    if (typeof document === "undefined" || !document.modelContext) return;

    const newAuth: FourServiceAuthoritativeState = {};

    for (const node of transaction.nodes) {
      const inspectTool = registeredToolsRef.current.find((t) => t.name === node.inspectTool);
      if (!inspectTool) continue;

      try {
        const raw = await document.modelContext.executeTool(
          inspectTool,
          JSON.stringify({ operationKey: node.operationKey })
        );
        const normalized = normalizeWebMCPResult(raw) as {
          exists?: boolean;
          database?: { id: string; name: string; operationKey: string; createdAt?: string };
          backend?: { id: string; projectName: string; databaseResourceId: string; healthUrl: string; operationKey: string };
          route?: { id: string; projectName: string; targetUrl: string; operationKey: string };
          frontend?: { id: string; projectName: string; backendResourceId: string; previewUrl: string; operationKey: string };
        };

        console.log(`[mcpx-dag] authoritative inspection for ${node.id}:`, normalized);

        if (normalized?.exists) {
          if (node.service === "database" && normalized.database) {
            newAuth.database = normalized.database;
          } else if (node.service === "compute" && normalized.backend) {
            newAuth.backend = normalized.backend;
          } else if (node.service === "routing" && normalized.route) {
            newAuth.routing = normalized.route;
          } else if (node.service === "frontend" && normalized.frontend) {
            newAuth.frontend = normalized.frontend;
          }
        }
      } catch (err) {
        console.error(`[mcpx-dag] inspect ${node.id} failed:`, err);
      }
    }

    setAuthoritativeState(newAuth);
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
    approveCompensation,
    rejectCompensation,
    inspectAllResources,
    resetDeployment,
    clearEventLog: () => setEventLog([]),
  };
}
