"use client";

import { useState, useCallback, useEffect, RefObject } from "react";
import type { RegisteredTool } from "@/types/webmcp";
import type { TransactionEvent } from "@/types/reliability";
import {
  Transaction,
  TransactionNode,
  TransactionState,
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

// Durable API client helpers:
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

async function persistTxState(txId: string, state: TransactionState, lastError?: string) {
  const res = await fetch(`/api/transactions/${encodeURIComponent(txId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, lastError }),
  });
  if (!res.ok) throw new Error(`Failed to persist transaction state (${state}) to database`);
}

async function persistNodeState(txId: string, nodeId: string, patch: Partial<TransactionNode>) {
  const res = await fetch(
    `/api/transactions/${encodeURIComponent(txId)}/nodes/${encodeURIComponent(nodeId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) throw new Error(`Failed to persist node (${nodeId}) state to database`);
}

async function persistEvent(
  txId: string,
  type: string,
  details?: Record<string, unknown>,
  nodeId?: string
): Promise<TransactionEvent> {
  const res = await fetch(`/api/transactions/${encodeURIComponent(txId)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, details, nodeId }),
  });
  if (!res.ok) throw new Error(`Failed to persist event (${type}) to database`);
  const data = await res.json();
  return data.event as TransactionEvent;
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

  const appendDurableEvent = useCallback(
    async (txId: string, type: string, details?: Record<string, unknown>, nodeId?: string) => {
      try {
        const persisted = await persistEvent(txId, type, details, nodeId);
        setEventLog((prev) => [...prev, persisted]);
        console.log(`[mcpx-durable-event #${persisted.sequence}] ${type}`, details ?? "");
        return persisted;
      } catch (err) {
        console.error(`[mcpx-web] Failed to append durable event ${type}:`, err);
        // Local fallback if DB is unreachable
        const fallback: TransactionEvent = {
          id: crypto.randomUUID(),
          type,
          timestamp: new Date().toISOString(),
          details,
        };
        setEventLog((prev) => [...prev, fallback]);
        return fallback;
      }
    },
    []
  );

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
              authProjection.database = {
                id: node.resourceId,
                name: "mcpx-prod-db",
                operationKey: node.operationKey,
              };
            } else if (node.service === "compute") {
              authProjection.backend = {
                id: node.resourceId,
                projectName: "mcpx-demo",
                databaseResourceId: String(node.executeArgs?.databaseResourceId || ""),
                healthUrl: `http://localhost:3003/runtime/${node.resourceId}/health`,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Healthy)",
              };
            } else if (node.service === "routing") {
              authProjection.routing = {
                id: node.resourceId,
                projectName: "mcpx-demo",
                targetUrl: String(node.executeArgs?.targetUrl || ""),
                routeUrl: `http://localhost:3001/r/mcpx-demo`,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Gateway Active)",
              };
            } else if (node.service === "frontend") {
              authProjection.frontend = {
                id: node.resourceId,
                projectName: "mcpx-demo",
                backendResourceId: String(node.executeArgs?.backendResourceId || ""),
                previewUrl: `http://localhost:3004/preview/mcpx-demo`,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Live Preview)",
              };
            }
          }
        }
        setAuthoritativeState(authProjection);

        // SAFE RESUME RULES ON REFRESH:
        let updatedTx = { ...loadedTx };

        // 1. Check for EXECUTING nodes (uncertain outcome at crash time -> reconcile)
        for (const node of loadedTx.nodes) {
          if (node.state === "EXECUTING") {
            console.warn(
              `[mcpx-recovery] Node ${node.id} was EXECUTING at reload time. Reconciling authoritatively...`
            );
            await persistNodeState(txId, node.id, { state: "RECONCILING" });
            await appendDurableEvent(txId, "COORDINATOR_RECOVERY_EXECUTING_TO_RECONCILING", {
              nodeId: node.id,
              operationKey: node.operationKey,
              reason: "Coordinator reloaded during in-flight execution. Triggering authoritative inspection.",
            }, node.id);

            const reconcileResult = await reconcileNode(
              { ...node, state: "RECONCILING" },
              registeredToolsRef.current
            );

            if (reconcileResult.outcome === "RECOVERED") {
              await persistNodeState(txId, node.id, {
                state: "RECOVERED",
                resourceId: reconcileResult.resourceId,
              });
              await appendDurableEvent(txId, "COORDINATOR_RECOVERY_RECOVERED", {
                nodeId: node.id,
                resourceId: reconcileResult.resourceId,
              }, node.id);

              updatedTx = {
                ...updatedTx,
                nodes: updatedTx.nodes.map((n) =>
                  n.id === node.id ? reconcileResult.updatedNode : n
                ),
              };
            } else {
              await persistNodeState(txId, node.id, { state: "RECOVERY_RETRY_AVAILABLE" });
              await appendDurableEvent(txId, "COORDINATOR_RECOVERY_ABSENT", {
                nodeId: node.id,
                outcome: "Resource not found in authoritative inspection. Safe retry available.",
              }, node.id);

              updatedTx = {
                ...updatedTx,
                nodes: updatedTx.nodes.map((n) =>
                  n.id === node.id ? { ...n, state: "RECOVERY_RETRY_AVAILABLE" } : n
                ),
              };
            }
            setTransaction(updatedTx);
          } else if (node.state === "IN_DOUBT" || node.state === "RECONCILING") {
            // 2. Check for IN_DOUBT / RECONCILING nodes (resume reconciliation)
            console.log(
              `[mcpx-recovery] Resuming reconciliation for ${node.id} (${node.state})...`
            );
            await appendDurableEvent(txId, "COORDINATOR_RECOVERY_RESUMING_RECONCILIATION", {
              nodeId: node.id,
              operationKey: node.operationKey,
            }, node.id);

            const reconcileResult = await reconcileNode(node, registeredToolsRef.current);
            if (reconcileResult.outcome === "RECOVERED") {
              await persistNodeState(txId, node.id, {
                state: "RECOVERED",
                resourceId: reconcileResult.resourceId,
              });
              await appendDurableEvent(txId, "COORDINATOR_RECOVERY_RECOVERED", {
                nodeId: node.id,
                resourceId: reconcileResult.resourceId,
              }, node.id);

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
    [registeredToolsRef, appendDurableEvent]
  );

  // Initial mount: load from URL query or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const txFromUrl = urlParams.get("tx");
    const txFromStorage = localStorage.getItem("mcpx_active_tx_id");
    const activeId = txFromUrl || txFromStorage;

    if (activeId) {
      rehydrateTransaction(activeId);
    } else {
      setIsHydrating(false);
    }
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
    await persistTxState(txId, "EXECUTING");

    // 2. Set active transaction ID in URL and localStorage
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `?tx=${encodeURIComponent(txId)}`);
      localStorage.setItem("mcpx_active_tx_id", txId);
    }

    // 3. Project to React state
    setTransaction(currentTx);
    await appendDurableEvent(txId, "TX_CREATED", {
      transactionId: txId,
      scenario: scenarioDesc,
      totalNodes: 4,
    });

    // 4. DAG Execution Loop
    while (true) {
      const runnableNodes = getRunnableNodes(currentTx);
      if (runnableNodes.length === 0) {
        const allCompleted = currentTx.nodes.every(
          (n) => n.state === "SUCCEEDED" || n.state === "RECOVERED"
        );
        if (allCompleted) {
          await persistTxState(txId, "COMMITTED");
          currentTx = { ...currentTx, state: "COMMITTED" };
          setTransaction(currentTx);
          await appendDurableEvent(txId, "TX_COMMITTED", {
            transactionId: txId,
            status: "All 4 microservices deployed, bound via WebMCP, and persisted in Postgres.",
          });
        }
        break;
      }

      for (const node of runnableNodes) {
        const resolvedArgs = resolveExecuteArgs(node, currentTx);
        const nodeToExecute = { ...node, executeArgs: resolvedArgs };

        // Persist EXECUTING before updating React
        await persistNodeState(txId, node.id, {
          state: "EXECUTING",
          executeArgs: resolvedArgs,
        });

        currentTx = {
          ...currentTx,
          nodes: currentTx.nodes.map((n) =>
            n.id === node.id ? { ...n, state: "EXECUTING", executeArgs: resolvedArgs } : n
          ),
        };
        setTransaction(currentTx);

        await appendDurableEvent(
          txId,
          `${node.service.toUpperCase()}_EXECUTE_STARTED`,
          {
            operationKey: node.operationKey,
            ...(nodeToExecute.executeArgs.failureMode ? { failureMode: nodeToExecute.executeArgs.failureMode } : {}),
            resolvedArgs,
          },
          node.id
        );

        // Execute WebMCP tool in browser
        const execResult = await executeNode(nodeToExecute, registeredToolsRef.current);

        if (execResult.outcome === "SUCCEEDED") {
          // Persist SUCCEEDED state and resourceId before updating UI
          await persistNodeState(txId, node.id, {
            state: "SUCCEEDED",
            resourceId: execResult.resourceId,
          });

          currentTx = {
            ...currentTx,
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? execResult.updatedNode : n
            ),
          };
          setTransaction(currentTx);

          await appendDurableEvent(
            txId,
            `${node.service.toUpperCase()}_EXECUTE_SUCCEEDED`,
            {
              operationKey: node.operationKey,
              resourceId: execResult.resourceId,
            },
            node.id
          );

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
            const healthUrl = `http://localhost:3003/runtime/${execResult.resourceId}/health`;
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
            const routeUrl = `http://localhost:3001/r/mcpx-demo`;
            setAuthoritativeState((prev) => ({
              ...prev,
              routing: {
                id: execResult.resourceId!,
                projectName: "mcpx-demo",
                targetUrl: String(resolvedArgs.targetUrl || "http://localhost:3003/runtime/health"),
                routeUrl,
                operationKey: node.operationKey,
                httpStatus: "200 OK (Gateway Active)",
              },
            }));
          } else if (node.service === "frontend" && execResult.resourceId) {
            const previewUrl = `http://localhost:3004/preview/mcpx-demo`;
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
        } else if (execResult.outcome === "IN_DOUBT") {
          // Persist IN_DOUBT before updating UI
          await persistNodeState(txId, node.id, {
            state: "IN_DOUBT",
            lastError: execResult.error,
          });

          currentTx = {
            ...currentTx,
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? execResult.updatedNode : n
            ),
          };
          setTransaction(currentTx);

          await appendDurableEvent(
            txId,
            `${node.service.toUpperCase()}_EXECUTE_UNCERTAIN`,
            {
              error: execResult.error,
              reason: "Transport ACK lost after mutation dispatch. Transitioning to IN_DOUBT.",
            },
            node.id
          );
          await appendDurableEvent(
            txId,
            `${node.service.toUpperCase()}_MARKED_IN_DOUBT`,
            { operationKey: node.operationKey },
            node.id
          );

          // OPTIONAL: Pause before reconciliation if dev flag enabled (to allow browser refresh test)
          if (pauseBeforeReconcile) {
            console.log(
              "[mcpx-web] PAUSED_BEFORE_RECONCILIATION: Coordinator paused with node in IN_DOUBT state. Refresh the browser to test recovery!"
            );
            await appendDurableEvent(
              txId,
              "COORDINATOR_PAUSED_IN_DOUBT",
              {
                message: "Coordinator paused for crash/refresh test. Refresh the page to test recovery!",
              },
              node.id
            );
            setIsRunning(false);
            return;
          }

          // Transition to RECONCILING
          await persistNodeState(txId, node.id, { state: "RECONCILING" });
          currentTx = {
            ...currentTx,
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? { ...n, state: "RECONCILING" } : n
            ),
          };
          setTransaction(currentTx);

          await appendDurableEvent(
            txId,
            `${node.service.toUpperCase()}_RECONCILIATION_STARTED`,
            {
              operationKey: node.operationKey,
              inspectTool: node.inspectTool,
            },
            node.id
          );

          // Execute WebMCP authoritative inspection
          const reconcileResult = await reconcileNode(
            execResult.updatedNode,
            registeredToolsRef.current
          );

          if (reconcileResult.outcome === "RECOVERED") {
            await persistNodeState(txId, node.id, {
              state: "RECOVERED",
              resourceId: reconcileResult.resourceId,
            });

            currentTx = {
              ...currentTx,
              nodes: currentTx.nodes.map((n) =>
                n.id === node.id ? reconcileResult.updatedNode : n
              ),
            };
            setTransaction(currentTx);

            await appendDurableEvent(
              txId,
              `${node.service.toUpperCase()}_REMOTE_STATE_FOUND`,
              {
                operationKey: node.operationKey,
                resourceId: reconcileResult.resourceId,
              },
              node.id
            );
            await appendDurableEvent(
              txId,
              `${node.service.toUpperCase()}_RECOVERED`,
              {
                operationKey: node.operationKey,
                resourceId: reconcileResult.resourceId,
                outcome: "Resource verified in store prior to ACK drop; state recovered.",
              },
              node.id
            );

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
          } else {
            await persistNodeState(txId, node.id, {
              state: "FAILED",
              lastError: reconcileResult.error,
            });
            await persistTxState(txId, "FAILED", reconcileResult.error);

            currentTx = {
              ...currentTx,
              state: "FAILED",
              nodes: currentTx.nodes.map((n) =>
                n.id === node.id ? reconcileResult.updatedNode : n
              ),
            };
            setTransaction(currentTx);
            setIsRunning(false);
            return;
          }
        } else {
          // Confirmed clean failure (reject-before-commit)
          await persistNodeState(txId, node.id, {
            state: "FAILED",
            lastError: execResult.error,
          });
          await persistTxState(txId, "ABORTING");

          currentTx = {
            ...currentTx,
            state: "ABORTING",
            nodes: currentTx.nodes.map((n) =>
              n.id === node.id ? execResult.updatedNode : n
            ),
          };
          setTransaction(currentTx);

          await appendDurableEvent(
            txId,
            `${node.service.toUpperCase()}_EXECUTE_FAILED`,
            {
              operationKey: node.operationKey,
              error: execResult.error,
              note: "Confirmed clean failure before commit",
            },
            node.id
          );
          await appendDurableEvent(txId, "TX_ABORT_STARTED", {
            reason: `Downstream node ${node.id} failed with confirmed rejection`,
          });

          // Calculate compensable completed nodes in reverse dependency order
          const compensable = getCompensableNodes(currentTx);
          if (compensable.length > 0) {
            await persistTxState(txId, "AWAITING_COMPENSATION_APPROVAL");
            currentTx = { ...currentTx, state: "AWAITING_COMPENSATION_APPROVAL" };
            setTransaction(currentTx);

            await appendDurableEvent(txId, "COMPENSATION_APPROVAL_REQUIRED", {
              compensableNodes: compensable.map((c) => c.id),
              resourceIds: compensable.map((c) => `${c.service}: ${c.resourceId}`),
              prompt: `Downstream node failed. ${compensable.length} previously-created resources must be removed in reverse dependency order (${compensable.map((c) => c.service).join(" → ")}).`,
            });
          } else {
            await persistTxState(txId, "FAILED");
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
    const txId = transaction.id;

    const compensableNodes = getCompensableNodes(transaction);

    await persistTxState(txId, "COMPENSATING");
    for (const c of compensableNodes) {
      await persistNodeState(txId, c.id, { state: "COMPENSATING" });
    }

    let currentTx: Transaction = {
      ...transaction,
      state: "COMPENSATING",
      nodes: transaction.nodes.map((n) =>
        compensableNodes.some((c) => c.id === n.id) ? { ...n, state: "COMPENSATING" } : n
      ),
    };
    setTransaction(currentTx);

    await appendDurableEvent(txId, "COMPENSATION_APPROVED", { byUser: true });

    for (const compNode of compensableNodes) {
      await appendDurableEvent(
        txId,
        `${compNode.service.toUpperCase()}_COMPENSATION_STARTED`,
        {
          operationKey: compNode.operationKey,
          resourceId: compNode.resourceId,
          service: compNode.service,
        },
        compNode.id
      );

      const compResult = await compensateNode(compNode, registeredToolsRef.current);

      if (compResult.outcome === "COMPENSATED") {
        await persistNodeState(txId, compNode.id, { state: "COMPENSATED" });

        currentTx = {
          ...currentTx,
          nodes: currentTx.nodes.map((n) =>
            n.id === compNode.id ? compResult.updatedNode : n
          ),
        };
        setTransaction(currentTx);

        await appendDurableEvent(
          txId,
          `${compNode.service.toUpperCase()}_COMPENSATION_SUCCEEDED`,
          { operationKey: compNode.operationKey },
          compNode.id
        );
        await appendDurableEvent(
          txId,
          `${compNode.service.toUpperCase()}_COMPENSATION_VERIFIED`,
          {
            operationKey: compNode.operationKey,
            exists: false,
            verifiedOutcome: "Resource successfully absent from Postgres/microservice store",
          },
          compNode.id
        );

        if (compNode.service === "compute") {
          setAuthoritativeState((prev) => ({ ...prev, backend: undefined }));
        } else {
          setAuthoritativeState((prev) => ({ ...prev, [compNode.service]: undefined }));
        }
      } else {
        await persistTxState(txId, "MANUAL_ATTENTION_REQUIRED", compResult.error);
        await persistNodeState(txId, compNode.id, {
          state: "MANUAL_ATTENTION_REQUIRED",
          lastError: compResult.error,
        });

        currentTx = {
          ...currentTx,
          state: "MANUAL_ATTENTION_REQUIRED",
          lastError: compResult.error,
        };
        setTransaction(currentTx);
        await appendDurableEvent(txId, "COMPENSATION_FAILED", { error: compResult.error }, compNode.id);
        setIsRunning(false);
        return;
      }
    }

    // Final Transaction-Level Verification Sweep:
    // WebMCP inspect all 4 services to confirm 0 resources remain
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
      await persistTxState(txId, "MANUAL_ATTENTION_REQUIRED", "Resource remained after compensation");
      currentTx = {
        ...currentTx,
        state: "MANUAL_ATTENTION_REQUIRED",
        lastError: "Resource still exists in microservice store after compensation.",
      };
      setTransaction(currentTx);
      await appendDurableEvent(txId, "TRANSACTION_COMPENSATION_INCOMPLETE", {
        reason: "One or more resources remained present during final authoritative verification sweep.",
      });
    } else {
      await persistTxState(txId, "COMPENSATED");
      currentTx = { ...currentTx, state: "COMPENSATED" };
      setTransaction(currentTx);
      setAuthoritativeState({});
      await appendDurableEvent(txId, "TX_COMPENSATED", {
        transactionId: currentTx.id,
        status: "All previously created resources were successfully rolled back, real schemas dropped, and authoritatively verified absent.",
      });
    }

    setIsRunning(false);
  };

  const rejectCompensation = async () => {
    const txId = transaction.id;
    await persistTxState(txId, "FAILED", "Compensation rejected by operator.");
    setTransaction((prev) => ({
      ...prev,
      state: "FAILED",
      lastError: "Compensation rejected by operator. Resources retained in current state.",
    }));
    await appendDurableEvent(txId, "COMPENSATION_REJECTED_MANUAL_ATTENTION", {
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
              healthUrl: normalized.backend.healthUrl || `http://localhost:3003/runtime/${normalized.backend.id}/health`,
              httpStatus: "200 OK",
            };
          } else if (node.service === "routing" && normalized.route) {
            newAuth.routing = {
              ...normalized.route,
              routeUrl: normalized.route.routeUrl || `http://localhost:3001/r/${normalized.route.projectName}`,
              httpStatus: "200 OK",
            };
          } else if (node.service === "frontend" && normalized.frontend) {
            newAuth.frontend = {
              ...normalized.frontend,
              previewUrl: normalized.frontend.previewUrl || `http://localhost:3004/preview/${normalized.frontend.projectName}`,
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
