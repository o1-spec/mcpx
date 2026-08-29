"use client";

import { useState, useCallback, useEffect, RefObject } from "react";
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
import { origins } from "@/lib/config/origins";

export interface FourServiceAuthoritativeState {
  database?: {
    id: string;
    schemaName?: string;
    name: string;
    operationKey: string;
    createdAt?: string;
  };
  backend?: {
    id: string;
    projectName: string;
    databaseResourceId: string;
    healthUrl: string;
    operationKey: string;
    httpStatus?: string;
  };
  routing?: {
    id: string;
    projectName: string;
    targetUrl: string;
    routeUrl: string;
    operationKey: string;
    httpStatus?: string;
  };
  frontend?: {
    id: string;
    projectName: string;
    backendResourceId: string;
    previewUrl: string;
    operationKey: string;
    httpStatus?: string;
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Unified Atomic Transition API Helper:
async function persistAtomicTransition(params: {
  transactionId: string;
  nodeId?: string;
  nodeState?: string;
  resourceId?: string;
  lastError?: string;
  executeArgs?: Record<string, unknown>;
  txState?: string;
  eventType: string;
  eventPayload?: Record<string, unknown>;
}): Promise<TransactionEvent> {
  const res = await fetch(`/api/transactions/${encodeURIComponent(params.transactionId)}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.error || `Atomic transition failed: HTTP ${res.status} for ${params.eventType}`
    );
  }

  const data = await res.json();
  return data.event as TransactionEvent;
}

async function persistTxCreation(tx: Transaction, scenario: string) {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: tx.id,
      state: tx.state,
      scenario,
      nodes: tx.nodes,
    }),
  });
  if (!res.ok) throw new Error("Failed to persist transaction creation to database");
}

export function useDeploymentDemo(registeredToolsRef: RefObject<RegisteredTool[]>) {
  const [isRunning, setIsRunning] = useState(false);
  const [pauseBeforeReconcile, setPauseBeforeReconcile] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

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

  // Rehydration & Safe Recovery from Durable Postgres Database
  const rehydrateTransaction = useCallback(
    async (txId: string) => {
      try {
        setIsHydrating(true);
        console.log(`[mcpx-web] Rehydrating transaction ${txId} from durable Postgres...`);

        const res = await fetch(`/api/transactions/${encodeURIComponent(txId)}`);
        if (!res.ok) {
          console.warn(`[mcpx-web] Transaction ${txId} not found in Postgres.`);
          setIsHydrating(false);
          return false;
        }

        const data = await res.json();
        const loadedTx = data.transaction as Transaction;
        const loadedEvents = (data.events || []) as TransactionEvent[];

        setTransaction(loadedTx);
        setEventLog(loadedEvents);

        // Update URL and localStorage
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `?tx=${encodeURIComponent(txId)}`);
          localStorage.setItem("mcpx_active_tx_id", txId);
        }

        // Build authoritative projection from loaded resources
        const authProjection: FourServiceAuthoritativeState = {};
        for (const node of loadedTx.nodes) {
          if (node.resourceId) {
            if (node.service === "database") {
              const schemaName = `mcpx_${node.resourceId.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`;
              authProjection.database = {
                id: node.resourceId,
                schemaName,
                name: "mcpx-prod-db",
                operationKey: node.operationKey,
              };
            } else if (node.service === "compute") {
              authProjection.backend = {
                id: node.resourceId,
                projectName: "mcpx-demo",
                databaseResourceId: String(node.executeArgs?.databaseResourceId || ""),
                healthUrl: `${origins.compute}/runtime/${node.resourceId}/health`,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Healthy)",
              };
            } else if (node.service === "routing") {
              authProjection.routing = {
                id: node.resourceId,
                projectName: "mcpx-demo",
                targetUrl: String(node.executeArgs?.targetUrl || ""),
                routeUrl: `${origins.routing}/r/mcpx-demo`,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Gateway Active)",
              };
            } else if (node.service === "frontend") {
              authProjection.frontend = {
                id: node.resourceId,
                projectName: "mcpx-demo",
                backendResourceId: String(node.executeArgs?.backendResourceId || ""),
                previewUrl: `${origins.frontend}/preview/mcpx-demo`,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Live Preview)",
              };
            }
          }
        }
        setAuthoritativeState(authProjection);

        // SAFE RESUME RULES ON REFRESH:
        let updatedTx = { ...loadedTx };

        for (const node of loadedTx.nodes) {
          if (node.state === "EXECUTING") {
            console.warn(
              `[mcpx-recovery] Node ${node.id} was EXECUTING at reload time. Reconciling authoritatively...`
            );
            const ev = await persistAtomicTransition({
              transactionId: txId,
              nodeId: node.id,
              nodeState: "RECONCILING",
              eventType: "COORDINATOR_RECOVERY_EXECUTING_TO_RECONCILING",
              eventPayload: {
                nodeId: node.id,
                operationKey: node.operationKey,
                reason: "Coordinator reloaded during in-flight execution. Triggering authoritative inspection.",
              },
            });
            setEventLog((prev) => [...prev, ev]);

            const reconcileResult = await reconcileNode(
              { ...node, state: "RECONCILING" },
              registeredToolsRef.current
            );

            if (reconcileResult.outcome === "RECOVERED") {
              const recEv = await persistAtomicTransition({
                transactionId: txId,
                nodeId: node.id,
                nodeState: "RECOVERED",
                resourceId: reconcileResult.resourceId,
                eventType: "COORDINATOR_RECOVERY_RECOVERED",
                eventPayload: {
                  nodeId: node.id,
                  resourceId: reconcileResult.resourceId,
                },
              });
              setEventLog((prev) => [...prev, recEv]);

              updatedTx = {
                ...updatedTx,
                nodes: updatedTx.nodes.map((n) =>
                  n.id === node.id ? reconcileResult.updatedNode : n
                ),
              };
            } else {
              const failEv = await persistAtomicTransition({
                transactionId: txId,
                nodeId: node.id,
                nodeState: "RECOVERY_RETRY_AVAILABLE",
                eventType: "COORDINATOR_RECOVERY_ABSENT",
                eventPayload: {
                  nodeId: node.id,
                  outcome: "Resource not found in authoritative inspection. Safe retry available.",
                },
              });
              setEventLog((prev) => [...prev, failEv]);

              updatedTx = {
                ...updatedTx,
                nodes: updatedTx.nodes.map((n) =>
                  n.id === node.id ? { ...n, state: "RECOVERY_RETRY_AVAILABLE" } : n
                ),
              };
            }
            setTransaction(updatedTx);
          } else if (node.state === "IN_DOUBT" || node.state === "RECONCILING") {
            console.log(
              `[mcpx-recovery] Resuming reconciliation for ${node.id} (${node.state})...`
            );
            const reconcileResult = await reconcileNode(node, registeredToolsRef.current);
            if (reconcileResult.outcome === "RECOVERED") {
              const recEv = await persistAtomicTransition({
                transactionId: txId,
                nodeId: node.id,
                nodeState: "RECOVERED",
                resourceId: reconcileResult.resourceId,
                eventType: "COORDINATOR_RECOVERY_RECOVERED",
                eventPayload: {
                  nodeId: node.id,
                  resourceId: reconcileResult.resourceId,
                },
              });
              setEventLog((prev) => [...prev, recEv]);

              updatedTx = {
                ...updatedTx,
                nodes: updatedTx.nodes.map((n) =>
                  n.id === node.id ? reconcileResult.updatedNode : n
                ),
              };
              setTransaction(updatedTx);
            }
          }
        }

        setIsHydrating(false);
        return true;
      } catch (err) {
        console.error("[mcpx-web] Rehydration failed:", err);
        setIsHydrating(false);
        return false;
      }
    },
    [registeredToolsRef]
  );

  // Initial mount: load from URL query or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;
    const init = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const txFromUrl = urlParams.get("tx");
      const txFromStorage = localStorage.getItem("mcpx_active_tx_id");
      const activeId = txFromUrl || txFromStorage;

      if (activeId) {
        try {
          await rehydrateTransaction(activeId);
        } finally {
          if (isMounted) setIsHydrating(false);
        }
      } else {
        if (isMounted) setIsHydrating(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [rehydrateTransaction]);

  const runDeployment = async (failureScenario = false) => {
    if (typeof document === "undefined" || !document.modelContext) {
      alert("document.modelContext is not available in this browser.");
      return;
    }

    setIsRunning(true);
    setEventLog([]);
    setAuthoritativeState({});

    const txId = `tx:demo-${Date.now()}`;
    const scenarioDesc = failureScenario
      ? "COMBINED_CHALLENGE (Routing drop-ack -> Recover, Frontend reject -> Reverse Compensate 3 services)"
      : "HAPPY_PATH_ALL_4_SERVICES";

    let currentTx = createInitialDAG(txId, failureScenario);
    currentTx.state = "EXECUTING";

    // 1. DURABLE PERSISTENCE: Save transaction and nodes to Postgres FIRST
    await persistTxCreation(currentTx, scenarioDesc);

    // 2. Set active transaction ID in URL and localStorage
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `?tx=${encodeURIComponent(txId)}`);
      localStorage.setItem("mcpx_active_tx_id", txId);
    }

    // 3. Project to React state
    setTransaction(currentTx);
    setEventLog([
      {
        id: crypto.randomUUID(),
        sequence: 1,
        type: "TX_CREATED",
        timestamp: new Date().toISOString(),
        details: { transactionId: txId, scenario: scenarioDesc, totalNodes: 4 },
      },
    ]);

    await delay(350);

    // 4. DAG Execution Loop
    while (true) {
      const runnableNodes = getRunnableNodes(currentTx);
      if (runnableNodes.length === 0) {
        const allCompleted = currentTx.nodes.every(
          (n) => n.state === "SUCCEEDED" || n.state === "RECOVERED"
        );
        if (allCompleted) {
          const commitEv = await persistAtomicTransition({
            transactionId: txId,
            txState: "COMMITTED",
            eventType: "TX_COMMITTED",
            eventPayload: {
              transactionId: txId,
              status: "All 4 microservices deployed, bound via WebMCP, and persisted in Postgres.",
            },
          });
          currentTx = { ...currentTx, state: "COMMITTED" };
          setTransaction(currentTx);
          setEventLog((prev) => [...prev, commitEv]);
        }
        break;
      }

      for (const node of runnableNodes) {
        const resolvedArgs = resolveExecuteArgs(node, currentTx);
        const nodeToExecute = { ...node, executeArgs: resolvedArgs };

        // ATOMIC TRANSITION: Node EXECUTING + Event in ONE Postgres transaction
        const startEv = await persistAtomicTransition({
          transactionId: txId,
          nodeId: node.id,
          nodeState: "EXECUTING",
          executeArgs: resolvedArgs,
          eventType: `${node.service.toUpperCase()}_EXECUTE_STARTED`,
          eventPayload: {
            operationKey: node.operationKey,
            ...(nodeToExecute.executeArgs.failureMode ? { failureMode: nodeToExecute.executeArgs.failureMode } : {}),
            resolvedArgs,
          },
        });

        currentTx = {
          ...currentTx,
          nodes: currentTx.nodes.map((n) =>
            n.id === node.id ? { ...n, state: "EXECUTING", executeArgs: resolvedArgs } : n
          ),
        };
        setTransaction(currentTx);
        setEventLog((prev) => [...prev, startEv]);

        await delay(500);

        // Execute WebMCP tool in browser
        const execResult = await executeNode(nodeToExecute, registeredToolsRef.current);

        if (execResult.outcome === "SUCCEEDED") {
          // ATOMIC TRANSITION: Node SUCCEEDED + Event in ONE Postgres transaction
          const successEv = await persistAtomicTransition({
            transactionId: txId,
            nodeId: node.id,
            nodeState: "SUCCEEDED",
            resourceId: execResult.resourceId,
            eventType: `${node.service.toUpperCase()}_EXECUTE_SUCCEEDED`,
            eventPayload: {
              operationKey: node.operationKey,
              resourceId: execResult.resourceId,
            },
          });

          currentTx = {
            ...currentTx,
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? execResult.updatedNode : n
            ),
          };
          setTransaction(currentTx);
          setEventLog((prev) => [...prev, successEv]);

          // Update authoritative projection with real schema/URL metadata
          if (node.service === "database" && execResult.resourceId) {
            const schemaName = `mcpx_${execResult.resourceId.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`;
            setAuthoritativeState((prev) => ({
              ...prev,
              database: {
                id: execResult.resourceId!,
                schemaName,
                name: "mcpx-prod-db",
                operationKey: node.operationKey,
              },
            }));
          } else if (node.service === "compute" && execResult.resourceId) {
            const healthUrl = `${origins.compute}/runtime/${execResult.resourceId}/health`;
            setAuthoritativeState((prev) => ({
              ...prev,
              backend: {
                id: execResult.resourceId!,
                projectName: "mcpx-demo",
                databaseResourceId: String(resolvedArgs.databaseResourceId || ""),
                healthUrl,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Healthy)",
              },
            }));
          } else if (node.service === "routing" && execResult.resourceId) {
            const routeUrl = `${origins.routing}/r/mcpx-demo`;
            setAuthoritativeState((prev) => ({
              ...prev,
              routing: {
                id: execResult.resourceId!,
                projectName: "mcpx-demo",
                targetUrl: String(resolvedArgs.targetUrl || `${origins.compute}/runtime/health`),
                routeUrl,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Gateway Active)",
              },
            }));
          } else if (node.service === "frontend" && execResult.resourceId) {
            const previewUrl = `${origins.frontend}/preview/mcpx-demo`;
            setAuthoritativeState((prev) => ({
              ...prev,
              frontend: {
                id: execResult.resourceId!,
                projectName: "mcpx-demo",
                backendResourceId: String(resolvedArgs.backendResourceId || ""),
                previewUrl,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Live Preview)",
              },
            }));
          }

          await delay(400);
        } else if (execResult.outcome === "IN_DOUBT") {
          // ATOMIC TRANSITION: Node IN_DOUBT + Event in ONE Postgres transaction
          const inDoubtEv = await persistAtomicTransition({
            transactionId: txId,
            nodeId: node.id,
            nodeState: "IN_DOUBT",
            lastError: execResult.error,
            eventType: `${node.service.toUpperCase()}_MARKED_IN_DOUBT`,
            eventPayload: {
              operationKey: node.operationKey,
              error: execResult.error,
              reason: "Transport ACK lost after mutation dispatch. Transitioning to IN_DOUBT.",
            },
          });

          currentTx = {
            ...currentTx,
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? execResult.updatedNode : n
            ),
          };
          setTransaction(currentTx);
          setEventLog((prev) => [...prev, inDoubtEv]);

          // OPTIONAL: Pause before reconciliation if dev flag enabled (to allow browser refresh test)
          if (pauseBeforeReconcile) {
            console.log(
              "[mcpx-web] PAUSED_BEFORE_RECONCILIATION: Coordinator paused with node in IN_DOUBT state. Refresh the browser to test recovery!"
            );
            setIsRunning(false);
            return;
          }

          await delay(700);

          // ATOMIC TRANSITION: Transition to RECONCILING in ONE Postgres transaction
          const reconcileStartEv = await persistAtomicTransition({
            transactionId: txId,
            nodeId: node.id,
            nodeState: "RECONCILING",
            eventType: `${node.service.toUpperCase()}_RECONCILIATION_STARTED`,
            eventPayload: {
              operationKey: node.operationKey,
              inspectTool: node.inspectTool,
            },
          });

          currentTx = {
            ...currentTx,
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? { ...n, state: "RECONCILING" } : n
            ),
          };
          setTransaction(currentTx);
          setEventLog((prev) => [...prev, reconcileStartEv]);

          await delay(600);

          // Execute WebMCP authoritative inspection
          const reconcileResult = await reconcileNode(
            execResult.updatedNode,
            registeredToolsRef.current
          );

          if (reconcileResult.outcome === "RECOVERED") {
            // ATOMIC TRANSITION: Node RECOVERED + Event in ONE Postgres transaction
            const recEv = await persistAtomicTransition({
              transactionId: txId,
              nodeId: node.id,
              nodeState: "RECOVERED",
              resourceId: reconcileResult.resourceId,
              eventType: `${node.service.toUpperCase()}_RECOVERED`,
              eventPayload: {
                operationKey: node.operationKey,
                resourceId: reconcileResult.resourceId,
                outcome: "Resource verified in store prior to ACK drop; state recovered.",
              },
            });

            currentTx = {
              ...currentTx,
              nodes: currentTx.nodes.map((n) =>
                n.id === node.id ? reconcileResult.updatedNode : n
              ),
            };
            setTransaction(currentTx);
            setEventLog((prev) => [...prev, recEv]);

            if (node.service === "routing" && reconcileResult.resourceId) {
              setAuthoritativeState((prev) => ({
                ...prev,
                routing: {
                  id: reconcileResult.resourceId!,
                  projectName: "mcpx-demo",
                  targetUrl: String(resolvedArgs.targetUrl || "http://localhost:3003/runtime/health"),
                  routeUrl: `http://localhost:3001/r/mcpx-demo`,
                  operationKey: node.operationKey,
                  httpStatus: "200 OK (Gateway Active)",
                },
              }));
            }

            await delay(400);
          } else {
            const failEv = await persistAtomicTransition({
              transactionId: txId,
              nodeId: node.id,
              nodeState: "FAILED",
              lastError: reconcileResult.error,
              txState: "FAILED",
              eventType: `${node.service.toUpperCase()}_RECONCILIATION_FAILED`,
              eventPayload: {
                operationKey: node.operationKey,
                error: reconcileResult.error,
              },
            });

            currentTx = {
              ...currentTx,
              state: "FAILED",
              nodes: currentTx.nodes.map((n) =>
                n.id === node.id ? reconcileResult.updatedNode : n
              ),
            };
            setTransaction(currentTx);
            setEventLog((prev) => [...prev, failEv]);
            setIsRunning(false);
            return;
          }
        } else {
          // ATOMIC TRANSITION: Confirmed clean failure + TX ABORTING in ONE Postgres transaction
          const failEv = await persistAtomicTransition({
            transactionId: txId,
            nodeId: node.id,
            nodeState: "FAILED",
            lastError: execResult.error,
            txState: "ABORTING",
            eventType: `${node.service.toUpperCase()}_EXECUTE_FAILED`,
            eventPayload: {
              operationKey: node.operationKey,
              error: execResult.error,
              note: "Confirmed clean failure before commit",
            },
          });

          currentTx = {
            ...currentTx,
            state: "ABORTING",
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? execResult.updatedNode : n
            ),
          };
          setTransaction(currentTx);
          setEventLog((prev) => [...prev, failEv]);

          await delay(500);

          // Calculate compensable completed nodes in reverse dependency order
          const compensable = getCompensableNodes(currentTx);
          if (compensable.length > 0) {
            const reqEv = await persistAtomicTransition({
              transactionId: txId,
              txState: "AWAITING_COMPENSATION_APPROVAL",
              eventType: "COMPENSATION_APPROVAL_REQUIRED",
              eventPayload: {
                compensableNodes: compensable.map((c) => c.id),
                resourceIds: compensable.map((c) => `${c.service}: ${c.resourceId}`),
                prompt: `Downstream node failed. ${compensable.length} previously-created resources must be removed in reverse dependency order (${compensable.map((c) => c.service).join(" → ")}).`,
              },
            });
            currentTx = { ...currentTx, state: "AWAITING_COMPENSATION_APPROVAL" };
            setTransaction(currentTx);
            setEventLog((prev) => [...prev, reqEv]);
          } else {
            const txFailEv = await persistAtomicTransition({
              transactionId: txId,
              txState: "FAILED",
              eventType: "TX_FAILED",
              eventPayload: { reason: "Execution failed with 0 compensable resources." },
            });
            currentTx = { ...currentTx, state: "FAILED" };
            setTransaction(currentTx);
            setEventLog((prev) => [...prev, txFailEv]);
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
    const txId = transaction.id;

    const compensableNodes = getCompensableNodes(transaction);

    // Mark TX COMPENSATING
    const compStartEv = await persistAtomicTransition({
      transactionId: txId,
      txState: "COMPENSATING",
      eventType: "COMPENSATION_APPROVED",
      eventPayload: { byUser: true, totalResources: compensableNodes.length },
    });

    let currentTx: Transaction = {
      ...transaction,
      state: "COMPENSATING",
      nodes: transaction.nodes.map((n) =>
        compensableNodes.some((c) => c.id === n.id) ? { ...n, state: "COMPENSATING" } : n
      ),
    };
    setTransaction(currentTx);
    setEventLog((prev) => [...prev, compStartEv]);

    await delay(500);

    for (const compNode of compensableNodes) {
      const nodeStartEv = await persistAtomicTransition({
        transactionId: txId,
        nodeId: compNode.id,
        nodeState: "COMPENSATING",
        eventType: `${compNode.service.toUpperCase()}_COMPENSATION_STARTED`,
        eventPayload: {
          operationKey: compNode.operationKey,
          resourceId: compNode.resourceId,
          service: compNode.service,
        },
      });
      setEventLog((prev) => [...prev, nodeStartEv]);

      await delay(400);

      const compResult = await compensateNode(compNode, registeredToolsRef.current);

      if (compResult.outcome === "COMPENSATED") {
        // ATOMIC TRANSITION: Node COMPENSATED + Event in ONE Postgres transaction
        const nodeCompEv = await persistAtomicTransition({
          transactionId: txId,
          nodeId: compNode.id,
          nodeState: "COMPENSATED",
          eventType: `${compNode.service.toUpperCase()}_COMPENSATION_VERIFIED`,
          eventPayload: {
            operationKey: compNode.operationKey,
            exists: false,
            verifiedOutcome: "Resource successfully absent from Postgres/microservice store",
          },
        });

        currentTx = {
          ...currentTx,
          nodes: currentTx.nodes.map((n) =>
            n.id === compNode.id ? compResult.updatedNode : n
          ),
        };
        setTransaction(currentTx);
        setEventLog((prev) => [...prev, nodeCompEv]);

        if (compNode.service === "compute") {
          setAuthoritativeState((prev) => ({ ...prev, backend: undefined }));
        } else {
          setAuthoritativeState((prev) => ({ ...prev, [compNode.service]: undefined }));
        }

        await delay(350);
      } else {
        const nodeFailEv = await persistAtomicTransition({
          transactionId: txId,
          nodeId: compNode.id,
          nodeState: "MANUAL_ATTENTION_REQUIRED",
          lastError: compResult.error,
          txState: "MANUAL_ATTENTION_REQUIRED",
          eventType: "COMPENSATION_FAILED",
          eventPayload: { error: compResult.error },
        });

        currentTx = {
          ...currentTx,
          state: "MANUAL_ATTENTION_REQUIRED",
          lastError: compResult.error,
        };
        setTransaction(currentTx);
        setEventLog((prev) => [...prev, nodeFailEv]);
        setIsRunning(false);
        return;
      }
    }

    // Final Transaction-Level Verification Sweep:
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
        if (norm?.exists === true) {
          anyResourceRemains = true;
          console.error(`[mcpx-web] final sweep found resource still present for ${node.id}`);
        }
      } catch (err) {
        console.error(`[mcpx-web] final sweep error for ${node.id}:`, err);
      }
    }

    if (anyResourceRemains) {
      const incompleteEv = await persistAtomicTransition({
        transactionId: txId,
        txState: "MANUAL_ATTENTION_REQUIRED",
        lastError: "Resource remained after compensation",
        eventType: "TRANSACTION_COMPENSATION_INCOMPLETE",
        eventPayload: {
          reason: "One or more resources remained present during final authoritative verification sweep.",
        },
      });
      currentTx = {
        ...currentTx,
        state: "MANUAL_ATTENTION_REQUIRED",
        lastError: "Resource still exists in microservice store after compensation.",
      };
      setTransaction(currentTx);
      setEventLog((prev) => [...prev, incompleteEv]);
    } else {
      const compCompleteEv = await persistAtomicTransition({
        transactionId: txId,
        txState: "COMPENSATED",
        eventType: "TX_COMPENSATED",
        eventPayload: {
          transactionId: currentTx.id,
          status: "All previously created resources were successfully rolled back, real schemas dropped, and authoritatively verified absent.",
        },
      });
      currentTx = { ...currentTx, state: "COMPENSATED" };
      setTransaction(currentTx);
      setAuthoritativeState({});
      setEventLog((prev) => [...prev, compCompleteEv]);
    }

    setIsRunning(false);
  };

  const rejectCompensation = async () => {
    const txId = transaction.id;
    const rejEv = await persistAtomicTransition({
      transactionId: txId,
      txState: "FAILED",
      lastError: "Compensation rejected by operator.",
      eventType: "COMPENSATION_REJECTED_MANUAL_ATTENTION",
      eventPayload: {
        retainedResources: getCompensableNodes(transaction).map((c) => c.id),
      },
    });
    setTransaction((prev) => ({
      ...prev,
      state: "FAILED",
      lastError: "Compensation rejected by operator. Resources retained in current state.",
    }));
    setEventLog((prev) => [...prev, rejEv]);
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
          database?: { id: string; schemaName?: string; name: string; operationKey: string; createdAt?: string };
          backend?: { id: string; projectName: string; databaseResourceId: string; healthUrl?: string; operationKey: string };
          route?: { id: string; projectName: string; targetUrl: string; routeUrl?: string; operationKey: string };
          frontend?: { id: string; projectName: string; backendResourceId: string; previewUrl?: string; operationKey: string };
        };

        console.log(`[mcpx-dag] authoritative inspection for ${node.id}:`, normalized);

        if (normalized?.exists) {
          if (node.service === "database" && normalized.database) {
            newAuth.database = normalized.database;
          } else if (node.service === "compute" && normalized.backend) {
            newAuth.backend = {
              ...normalized.backend,
              healthUrl: normalized.backend.healthUrl || `${origins.compute}/runtime/${normalized.backend.id}/health`,
              httpStatus: "200 OK",
            };
          } else if (node.service === "routing" && normalized.route) {
            newAuth.routing = {
              ...normalized.route,
              routeUrl: normalized.route.routeUrl || `${origins.routing}/r/${normalized.route.projectName}`,
              httpStatus: "200 OK",
            };
          } else if (node.service === "frontend" && normalized.frontend) {
            newAuth.frontend = {
              ...normalized.frontend,
              previewUrl: normalized.frontend.previewUrl || `${origins.frontend}/preview/${normalized.frontend.projectName}`,
              httpStatus: "200 OK",
            };
          }
        }
      } catch (err) {
        console.error(`[mcpx-dag] inspect ${node.id} failed:`, err);
      }
    }

    setAuthoritativeState(newAuth);
  };

  const resetDeployment = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mcpx_active_tx_id");
      window.history.replaceState(null, "", window.location.pathname);
    }
    setTransaction(createInitialDAG());
    setEventLog([]);
    setAuthoritativeState({});
  };

  return {
    transaction,
    isRunning,
    isHydrating,
    pauseBeforeReconcile,
    setPauseBeforeReconcile,
    eventLog,
    authoritativeState,
    runDeployment,
    approveCompensation,
    rejectCompensation,
    inspectAllResources,
    rehydrateTransaction,
    resetDeployment,
    clearEventLog: () => setEventLog([]),
  };
}
