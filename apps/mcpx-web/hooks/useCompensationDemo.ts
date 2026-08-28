"use client";

import { useState, useCallback, RefObject } from "react";
import type { RegisteredTool } from "@/types/webmcp";
import type {
  TransactionEvent,
  AuthoritativeState,
} from "@/types/reliability";
import {
  Transaction,
  createTransactionNode,
  getRunnableNodes,
  getCompensableNodes,
  executeNode,
  compensateNode,
} from "@/lib/transaction";

export function useCompensationDemo(registeredToolsRef: RefObject<RegisteredTool[]>) {
  const [isRunning, setIsRunning] = useState(false);

  const initialTx: Transaction = {
    id: "tx:demo-init",
    state: "CREATED",
    nodes: [
      createTransactionNode({
        service: "database",
        id: "database:create",
        label: "Database Service (create_database)",
        operationKey: "tx:init:database:create",
        dependencies: [],
        executeArgs: {
          name: "mcpx-prod-db",
          operationKey: "tx:init:database:create",
        },
      }),
      createTransactionNode({
        service: "routing",
        id: "routing:create",
        label: "Routing Service (create_route)",
        operationKey: "tx:init:routing:create",
        dependencies: ["database:create"],
        executeArgs: {
          projectName: "mcpx-demo",
          targetUrl: "http://localhost:4000",
          operationKey: "tx:init:routing:create",
          failureMode: "reject-before-commit",
        },
      }),
    ],
  };

  const [transaction, setTransaction] = useState<Transaction>(initialTx);
  const [eventLog, setEventLog] = useState<TransactionEvent[]>([]);
  const [authoritativeState, setAuthoritativeState] = useState<AuthoritativeState>({
    inspected: false,
  });

  const appendEvent = useCallback(
    (type: string, details?: Record<string, unknown>) => {
      const newEvent: TransactionEvent = {
        id: crypto.randomUUID(),
        type,
        timestamp: new Date().toISOString(),
        details,
      };
      setEventLog((prev) => [...prev, newEvent]);
      console.log(`[mcpx-saga-event] ${type}`, details ?? "");
    },
    []
  );

  const runCompensationDemo = async () => {
    if (typeof document === "undefined" || !document.modelContext) {
      alert("document.modelContext is not available in this browser.");
      return;
    }

    setIsRunning(true);
    setEventLog([]);
    setAuthoritativeState({ inspected: false });

    const txId = `tx:demo-${Date.now()}`;
    const dbOpKey = `${txId}:database:create`;
    const routeOpKey = `${txId}:routing:create`;

    const dbNode = createTransactionNode({
      service: "database",
      id: "database:create",
      label: "Database Service (create_database)",
      operationKey: dbOpKey,
      dependencies: [],
      executeArgs: {
        name: "mcpx-prod-db",
        operationKey: dbOpKey,
      },
    });

    const routeNode = createTransactionNode({
      service: "routing",
      id: "routing:create",
      label: "Routing Service (create_route)",
      operationKey: routeOpKey,
      dependencies: ["database:create"],
      executeArgs: {
        projectName: "mcpx-demo",
        targetUrl: "http://localhost:4000",
        operationKey: routeOpKey,
        failureMode: "reject-before-commit",
      },
    });

    let currentTx: Transaction = {
      id: txId,
      state: "EXECUTING",
      nodes: [dbNode, routeNode],
    };

    setTransaction(currentTx);
    appendEvent("TX_CREATED", { transactionId: txId, dbOpKey, routeOpKey });

    while (true) {
      const runnable = getRunnableNodes(currentTx);
      if (runnable.length === 0) break;

      for (const node of runnable) {
        currentTx = {
          ...currentTx,
          nodes: currentTx.nodes.map((n) =>
            n.id === node.id ? { ...n, state: "EXECUTING" } : n
          ),
        };
        setTransaction(currentTx);

        appendEvent(`${node.service.toUpperCase()}_EXECUTE_STARTED`, {
          operationKey: node.operationKey,
          ...(node.executeArgs.failureMode ? { failureMode: node.executeArgs.failureMode } : {}),
        });

        const execResult = await executeNode(node, registeredToolsRef.current);

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

          if (node.service === "database" && execResult.resourceId) {
            setAuthoritativeState((prev) => ({
              ...prev,
              inspected: true,
              database: {
                id: execResult.resourceId!,
                name: "mcpx-prod-db",
                operationKey: node.operationKey,
                createdAt: new Date().toISOString(),
              },
            }));
          }
        } else if (execResult.outcome === "FAILED") {
          appendEvent(`${node.service.toUpperCase()}_EXECUTE_FAILED`, {
            operationKey: node.operationKey,
            error: execResult.error,
            note: "Confirmed failure before commit",
          });

          currentTx = { ...currentTx, state: "ABORTING" };
          setTransaction(currentTx);
          appendEvent("TX_ABORT_STARTED", {
            reason: `Downstream node ${node.id} failed with confirmed rejection`,
          });

          const compensable = getCompensableNodes(currentTx);
          if (compensable.length > 0) {
            currentTx = { ...currentTx, state: "AWAITING_COMPENSATION_APPROVAL" };
            setTransaction(currentTx);
            appendEvent("COMPENSATION_APPROVAL_REQUIRED", {
              compensableNodes: compensable.map((c) => c.id),
              resourceId: compensable[0]?.resourceId,
              prompt: "Routing failed. 1 previously-created resource must be removed to restore the transaction.",
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

        if (compNode.service === "database") {
          setAuthoritativeState((prev) => ({
            ...prev,
            database: undefined,
          }));
        }
      } else {
        currentTx = {
          ...currentTx,
          state: "FAILED",
          lastError: compResult.error,
        };
        setTransaction(currentTx);
        appendEvent("COMPENSATION_FAILED", { error: compResult.error });
        setIsRunning(false);
        return;
      }
    }

    currentTx = { ...currentTx, state: "COMPENSATED" };
    setTransaction(currentTx);
    appendEvent("TX_COMPENSATED", {
      transactionId: currentTx.id,
      status: "Transaction fully rolled back and compensated.",
    });

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

  const resetCompensationDemo = () => {
    setTransaction(initialTx);
    setEventLog([]);
    setAuthoritativeState({ inspected: false });
  };

  return {
    transaction,
    isRunning,
    eventLog,
    authoritativeState,
    runCompensationDemo,
    approveCompensation,
    rejectCompensation,
    resetCompensationDemo,
    clearEventLog: () => setEventLog([]),
  };
}
