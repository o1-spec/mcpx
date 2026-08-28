"use client";

import { useState, useCallback, RefObject } from "react";
import type { RegisteredTool } from "@/types/webmcp";
import type {
  TransactionNode,
  TransactionEvent,
  AuthoritativeState,
} from "@/types/reliability";
import {
  createTransactionNode,
  executeNode,
  reconcileNode,
} from "@/lib/transaction";

export function useReliabilityDemo(registeredToolsRef: RefObject<RegisteredTool[]>) {
  const [reliabilityOpKey, setReliabilityOpKey] = useState("tx:demo-002:routing:create");
  const [isRunning, setIsRunning] = useState(false);
  const [transactionNode, setTransactionNode] = useState<TransactionNode>(
    createTransactionNode({
      service: "routing",
      id: "routing:create",
      label: "Routing Service (create_route)",
      operationKey: "tx:demo-002:routing:create",
      executeArgs: {
        projectName: "mcpx-demo",
        targetUrl: "http://localhost:4000",
        operationKey: "tx:demo-002:routing:create",
        failureMode: "drop-ack-after-commit",
      },
    })
  );
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
      console.log(`[mcpx-event] ${type}`, details ?? "");
    },
    []
  );

  const runReliabilityDemo = async () => {
    if (typeof document === "undefined" || !document.modelContext) {
      alert("document.modelContext is not available in this browser.");
      return;
    }

    setIsRunning(true);
    setEventLog([]);
    setAuthoritativeState({ inspected: false });

    const currentOpKey = `tx:demo-${Date.now()}:routing:create`;
    setReliabilityOpKey(currentOpKey);

    const node = createTransactionNode({
      service: "routing",
      id: "routing:create",
      label: "Routing Service (create_route)",
      operationKey: currentOpKey,
      executeArgs: {
        projectName: "mcpx-demo",
        targetUrl: "http://localhost:4000",
        operationKey: currentOpKey,
        failureMode: "drop-ack-after-commit",
      },
    });

    setTransactionNode({ ...node, state: "EXECUTING" });
    appendEvent("ROUTE_EXECUTE_STARTED", {
      operationKey: currentOpKey,
      projectName: "mcpx-demo",
      targetUrl: "http://localhost:4000",
      failureMode: "drop-ack-after-commit",
    });

    const execResult = await executeNode(node, registeredToolsRef.current);
    setTransactionNode(execResult.updatedNode);

    if (execResult.outcome === "SUCCEEDED") {
      appendEvent("ROUTE_EXECUTE_SUCCEEDED", { operationKey: currentOpKey });
      setIsRunning(false);
      return;
    }

    if (execResult.outcome === "IN_DOUBT") {
      appendEvent("ROUTE_EXECUTE_UNCERTAIN", {
        error: execResult.error,
        reason:
          "Transport error occurred after mutation dispatch. Cannot determine if server committed.",
      });
      appendEvent("ROUTE_MARKED_IN_DOUBT", { operationKey: currentOpKey });
    }

    setTransactionNode((prev) => ({ ...prev, state: "RECONCILING" }));
    appendEvent("ROUTE_RECONCILIATION_STARTED", {
      operationKey: currentOpKey,
      method: "WebMCP get_route inspection",
    });

    const reconcileResult = await reconcileNode(
      execResult.updatedNode,
      registeredToolsRef.current
    );
    setTransactionNode(reconcileResult.updatedNode);

    if (reconcileResult.outcome === "RECOVERED") {
      const routeData = reconcileResult.resource as {
        id?: string;
        projectName?: string;
        createdAt?: string;
      };

      setAuthoritativeState({
        inspected: true,
        exists: true,
        route: {
          id: reconcileResult.resourceId ?? routeData?.id ?? "unknown",
          projectName: routeData?.projectName ?? "mcpx-demo",
          targetUrl: "http://localhost:4000",
          operationKey: currentOpKey,
          createdAt: routeData?.createdAt ?? new Date().toISOString(),
        },
      });

      appendEvent("ROUTE_REMOTE_STATE_FOUND", {
        operationKey: currentOpKey,
        resourceId: reconcileResult.resourceId,
        projectName: routeData?.projectName,
        createdAt: routeData?.createdAt,
      });
      appendEvent("ROUTE_RECOVERED", {
        operationKey: currentOpKey,
        resourceId: reconcileResult.resourceId,
        reconciliationOutcome:
          "Resource was committed prior to ACK drop; state recovered successfully.",
      });
    } else if (reconcileResult.outcome === "ABSENT") {
      setAuthoritativeState({ inspected: true, exists: false });
      appendEvent("ROUTE_REMOTE_STATE_ABSENT", {
        operationKey: currentOpKey,
        message: "Authoritative inspection confirmed no resource exists in routeStore.",
      });
    } else {
      setAuthoritativeState({ inspected: true, exists: undefined });
      appendEvent("ROUTE_INSPECTION_UNINTERPRETABLE", {
        operationKey: currentOpKey,
        raw: reconcileResult.rawResult as Record<string, unknown>,
        normalized: (reconcileResult.normalizedResult as Record<string, unknown>) ?? null,
      });
    }

    setIsRunning(false);
  };

  const resetReliabilityDemo = () => {
    setTransactionNode(
      createTransactionNode({
        service: "routing",
        id: "routing:create",
        label: "Routing Service (create_route)",
        operationKey: reliabilityOpKey,
        executeArgs: {
          projectName: "mcpx-demo",
          targetUrl: "http://localhost:4000",
          operationKey: reliabilityOpKey,
          failureMode: "drop-ack-after-commit",
        },
      })
    );
    setEventLog([]);
    setAuthoritativeState({ inspected: false });
  };

  return {
    reliabilityOpKey,
    setReliabilityOpKey,
    isRunning,
    transactionNode,
    eventLog,
    authoritativeState,
    runReliabilityDemo,
    resetReliabilityDemo,
    clearEventLog: () => setEventLog([]),
  };
}
