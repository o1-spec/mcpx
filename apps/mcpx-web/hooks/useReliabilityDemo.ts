"use client";

import { useState, useCallback, RefObject } from "react";
import type { RegisteredTool } from "@/types/webmcp";
import type {
  TransactionNode,
  TransactionEvent,
  AuthoritativeState,
} from "@/types/reliability";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";

export function useReliabilityDemo(registeredToolsRef: RefObject<RegisteredTool[]>) {
  const [reliabilityOpKey, setReliabilityOpKey] = useState("tx:demo-002:routing:create");
  const [isRunning, setIsRunning] = useState(false);
  const [transactionNode, setTransactionNode] = useState<TransactionNode>({
    id: "routing:create",
    state: "PENDING",
    operationKey: "tx:demo-002:routing:create",
  });
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

    const createTool = registeredToolsRef.current.find((t) => t.name === "create_route");
    const getTool = registeredToolsRef.current.find((t) => t.name === "get_route");

    if (!createTool || !getTool) {
      alert("WebMCP tools not fully discovered. Please ensure iframe is loaded and tools are registered.");
      return;
    }

    setIsRunning(true);
    setEventLog([]);
    setAuthoritativeState({ inspected: false });

    // Generate fresh operation key per demo run
    const currentOpKey = `tx:demo-${Date.now()}:routing:create`;
    setReliabilityOpKey(currentOpKey);

    // 1. PENDING -> EXECUTING
    setTransactionNode({
      id: "routing:create",
      state: "EXECUTING",
      operationKey: currentOpKey,
    });
    appendEvent("ROUTE_EXECUTE_STARTED", {
      operationKey: currentOpKey,
      projectName: "mcpx-demo",
      targetUrl: "http://localhost:4000",
      failureMode: "drop-ack-after-commit",
    });

    try {
      // 2. Invoke create_route with drop-ack-after-commit chaos injection
      const createArgs = {
        projectName: "mcpx-demo",
        targetUrl: "http://localhost:4000",
        operationKey: currentOpKey,
        failureMode: "drop-ack-after-commit",
      };

      console.log("[mcpx-web] [reliability] calling create_route with drop-ack-after-commit...");
      await document.modelContext.executeTool(createTool, JSON.stringify(createArgs));

      setTransactionNode({
        id: "routing:create",
        state: "SUCCEEDED",
        operationKey: currentOpKey,
      });
      appendEvent("ROUTE_EXECUTE_SUCCEEDED", { operationKey: currentOpKey });
      setIsRunning(false);
      return;
    } catch (err: unknown) {
      // 3. Acknowledgement lost -> EXECUTING -> IN_DOUBT
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn("[mcpx-web] [reliability] transport error caught:", errMsg);

      appendEvent("ROUTE_EXECUTE_UNCERTAIN", {
        error: errMsg,
        reason:
          "Transport error occurred after mutation dispatch. Cannot determine if server committed.",
      });

      setTransactionNode({
        id: "routing:create",
        state: "IN_DOUBT",
        operationKey: currentOpKey,
        lastError: errMsg,
      });
      appendEvent("ROUTE_MARKED_IN_DOUBT", { operationKey: currentOpKey });
    }

    // 4. Authoritative Reconciliation: IN_DOUBT -> RECONCILING
    setTransactionNode((prev) => ({ ...prev, state: "RECONCILING" }));
    appendEvent("ROUTE_RECONCILIATION_STARTED", {
      operationKey: currentOpKey,
      method: "WebMCP get_route inspection",
    });

    try {
      // 5. Invoke get_route through WebMCP with the EXACT SAME operationKey
      console.log("[mcpx-web] reconciliation operationKey", currentOpKey);

      const rawInspectResult = await document.modelContext.executeTool(
        getTool,
        JSON.stringify({ operationKey: currentOpKey })
      );

      console.log("[mcpx-web] raw get_route WebMCP result", rawInspectResult);

      const normalized = normalizeWebMCPResult(rawInspectResult);

      console.log("[mcpx-web] normalized get_route result", normalized);

      const inspection =
        normalized && typeof normalized === "object"
          ? (normalized as {
              exists?: boolean;
              route?: {
                id: string;
                projectName: string;
                targetUrl: string;
                operationKey: string;
                createdAt: string;
              };
            })
          : null;

      console.log("[mcpx-web] normalized exists value", inspection?.exists);
      console.log("[mcpx-web] normalized resource ID", inspection?.route?.id);

      if (inspection?.exists === true && inspection.route) {
        // 6. Resource exists -> RECONCILING -> RECOVERED
        const foundRoute = inspection.route;
        setAuthoritativeState({
          inspected: true,
          exists: true,
          route: foundRoute,
        });

        setTransactionNode({
          id: "routing:create",
          state: "RECOVERED",
          operationKey: currentOpKey,
          resourceId: foundRoute.id,
        });

        appendEvent("ROUTE_REMOTE_STATE_FOUND", {
          operationKey: currentOpKey,
          resourceId: foundRoute.id,
          projectName: foundRoute.projectName,
          createdAt: foundRoute.createdAt,
        });
        appendEvent("ROUTE_RECOVERED", {
          operationKey: currentOpKey,
          resourceId: foundRoute.id,
          reconciliationOutcome:
            "Resource was committed prior to ACK drop; state recovered successfully.",
        });
      } else if (inspection?.exists === false) {
        // 7. Resource explicitly absent -> RECONCILING -> FAILED
        setAuthoritativeState({ inspected: true, exists: false });
        setTransactionNode({
          id: "routing:create",
          state: "FAILED",
          operationKey: currentOpKey,
          lastError: "Authoritative inspection found no resource.",
        });
        appendEvent("ROUTE_REMOTE_STATE_ABSENT", {
          operationKey: currentOpKey,
          message: "Authoritative inspection confirmed no resource exists in routeStore.",
        });
      } else {
        // 8. Result uninterpretable / malformed -> Remain RECONCILING!
        console.warn("[mcpx-web] Inspection result could not be interpreted:", normalized);
        setAuthoritativeState({ inspected: true, exists: undefined });
        setTransactionNode((prev) => ({
          ...prev,
          state: "RECONCILING",
          lastError: "Inspection result could not be interpreted.",
        }));
        appendEvent("ROUTE_INSPECTION_UNINTERPRETABLE", {
          operationKey: currentOpKey,
          raw: rawInspectResult as Record<string, unknown>,
          normalized: (normalized as Record<string, unknown>) ?? null,
        });
      }
    } catch (inspectErr: unknown) {
      const inspectErrMsg = inspectErr instanceof Error ? inspectErr.message : String(inspectErr);
      setTransactionNode((prev) => ({
        ...prev,
        state: "RECONCILING",
        lastError: `Inspection failed: ${inspectErrMsg}`,
      }));
      appendEvent("ROUTE_RECONCILIATION_FAILED_TO_INSPECT", {
        operationKey: currentOpKey,
        error: inspectErrMsg,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const resetReliabilityDemo = () => {
    setTransactionNode({
      id: "routing:create",
      state: "PENDING",
      operationKey: reliabilityOpKey,
    });
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
