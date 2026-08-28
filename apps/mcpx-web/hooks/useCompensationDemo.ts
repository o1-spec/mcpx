"use client";

import { useState, useCallback, RefObject } from "react";
import type { RegisteredTool } from "@/types/webmcp";
import type {
  TransactionModel,
  TransactionEvent,
  AuthoritativeState,
} from "@/types/reliability";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";

export function useCompensationDemo(registeredToolsRef: RefObject<RegisteredTool[]>) {
  const [isRunning, setIsRunning] = useState(false);
  const [transaction, setTransaction] = useState<TransactionModel>({
    id: "tx:demo-init",
    state: "CREATED",
    nodes: [
      {
        id: "database:create",
        label: "Database Service (create_database)",
        state: "PENDING",
        operationKey: "tx:init:database:create",
      },
      {
        id: "routing:create",
        label: "Routing Service (create_route)",
        state: "PENDING",
        operationKey: "tx:init:routing:create",
      },
    ],
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
      console.log(`[mcpx-saga-event] ${type}`, details ?? "");
    },
    []
  );

  const runCompensationDemo = async () => {
    if (typeof document === "undefined" || !document.modelContext) {
      alert("document.modelContext is not available in this browser.");
      return;
    }

    const createDbTool = registeredToolsRef.current.find((t) => t.name === "create_database");
    const createRouteTool = registeredToolsRef.current.find((t) => t.name === "create_route");

    if (!createDbTool || !createRouteTool) {
      alert("Required WebMCP tools (create_database, create_route) not discovered.");
      return;
    }

    setIsRunning(true);
    setEventLog([]);
    setAuthoritativeState({ inspected: false });

    const txId = `tx:demo-${Date.now()}`;
    const dbOpKey = `${txId}:database:create`;
    const routeOpKey = `${txId}:routing:create`;

    // 1. Transaction CREATED -> EXECUTING
    const initialTx: TransactionModel = {
      id: txId,
      state: "EXECUTING",
      nodes: [
        {
          id: "database:create",
          label: "Database Service (create_database)",
          state: "PENDING",
          operationKey: dbOpKey,
        },
        {
          id: "routing:create",
          label: "Routing Service (create_route)",
          state: "PENDING",
          operationKey: routeOpKey,
        },
      ],
    };

    setTransaction(initialTx);
    appendEvent("TX_CREATED", { transactionId: txId, dbOpKey, routeOpKey });

    let createdDbId: string | undefined;

    // 2. Step 1: Execute create_database through WebMCP
    setTransaction((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === "database:create" ? { ...n, state: "EXECUTING" } : n
      ),
    }));
    appendEvent("DATABASE_EXECUTE_STARTED", { operationKey: dbOpKey });

    try {
      const rawDbRes = await document.modelContext.executeTool(
        createDbTool,
        JSON.stringify({
          name: "mcpx-prod-db",
          operationKey: dbOpKey,
        })
      );

      const normalizedDb = normalizeWebMCPResult(rawDbRes) as {
        status?: string;
        database?: { id: string; name: string; operationKey: string; createdAt: string };
      };

      createdDbId = normalizedDb?.database?.id;

      setTransaction((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === "database:create"
            ? { ...n, state: "SUCCEEDED", resourceId: createdDbId }
            : n
        ),
      }));

      setAuthoritativeState((prev) => ({
        ...prev,
        inspected: true,
        database: normalizedDb.database,
      }));

      appendEvent("DATABASE_EXECUTE_SUCCEEDED", {
        operationKey: dbOpKey,
        resourceId: createdDbId,
      });
    } catch (err: unknown) {
      console.error("[mcpx-saga] database execution failed unexpectedly:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setTransaction((prev) => ({
        ...prev,
        state: "FAILED",
        nodes: prev.nodes.map((n) =>
          n.id === "database:create" ? { ...n, state: "FAILED", lastError: errMsg } : n
        ),
      }));
      setIsRunning(false);
      return;
    }

    // 3. Step 2: Execute create_route with confirmed failure: failureMode = "reject-before-commit"
    setTransaction((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === "routing:create" ? { ...n, state: "EXECUTING" } : n
      ),
    }));
    appendEvent("ROUTE_EXECUTE_STARTED", {
      operationKey: routeOpKey,
      failureMode: "reject-before-commit",
    });

    try {
      await document.modelContext.executeTool(
        createRouteTool,
        JSON.stringify({
          projectName: "mcpx-demo",
          targetUrl: "http://localhost:4000",
          operationKey: routeOpKey,
          failureMode: "reject-before-commit",
        })
      );

      // Unexpected success
      setTransaction((prev) => ({
        ...prev,
        state: "COMMITTED",
        nodes: prev.nodes.map((n) =>
          n.id === "routing:create" ? { ...n, state: "SUCCEEDED" } : n
        ),
      }));
      setIsRunning(false);
      return;
    } catch (routeErr: unknown) {
      const errMsg = routeErr instanceof Error ? routeErr.message : String(routeErr);
      console.warn("[mcpx-saga] routing confirmed failure:", errMsg);

      // Confirmed clean failure -> routing:create is FAILED
      setTransaction((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === "routing:create"
            ? { ...n, state: "FAILED", lastError: errMsg }
            : n
        ),
      }));
      appendEvent("ROUTE_EXECUTE_FAILED", {
        operationKey: routeOpKey,
        error: errMsg,
        note: "Confirmed failure before commit",
      });
    }

    // 4. Step 3: Transaction ABORTING -> AWAITING_COMPENSATION_APPROVAL
    setTransaction((prev) => ({
      ...prev,
      state: "ABORTING",
    }));
    appendEvent("TX_ABORT_STARTED", {
      reason: "Downstream node routing:create failed with confirmed rejection",
    });

    // 5. Require Human Approval
    setTransaction((prev) => ({
      ...prev,
      state: "AWAITING_COMPENSATION_APPROVAL",
    }));
    appendEvent("COMPENSATION_APPROVAL_REQUIRED", {
      compensableNodes: ["database:create"],
      resourceId: createdDbId,
      prompt: "Routing failed. 1 previously-created resource must be removed to restore the transaction.",
    });

    setIsRunning(false);
  };

  const approveCompensation = async () => {
    if (typeof document === "undefined" || !document.modelContext) return;

    const deleteDbTool = registeredToolsRef.current.find((t) => t.name === "delete_database");
    const getDbTool = registeredToolsRef.current.find((t) => t.name === "get_database");

    if (!deleteDbTool || !getDbTool) {
      alert("WebMCP database tools not found for compensation.");
      return;
    }

    const dbNode = transaction.nodes.find((n) => n.id === "database:create");
    if (!dbNode) return;

    setIsRunning(true);

    // 1. Transaction & Node -> COMPENSATING
    setTransaction((prev) => ({
      ...prev,
      state: "COMPENSATING",
      nodes: prev.nodes.map((n) =>
        n.id === "database:create" ? { ...n, state: "COMPENSATING" } : n
      ),
    }));
    appendEvent("COMPENSATION_APPROVED", { byUser: true });
    appendEvent("DATABASE_COMPENSATION_STARTED", {
      operationKey: dbNode.operationKey,
      resourceId: dbNode.resourceId,
    });

    try {
      // 2. Invoke delete_database via WebMCP
      await document.modelContext.executeTool(
        deleteDbTool,
        JSON.stringify({ operationKey: dbNode.operationKey })
      );
      appendEvent("DATABASE_COMPENSATION_SUCCEEDED", { operationKey: dbNode.operationKey });

      // 3. Authoritatively verify with get_database via WebMCP
      const rawInspect = await document.modelContext.executeTool(
        getDbTool,
        JSON.stringify({ operationKey: dbNode.operationKey })
      );
      const normalizedInspect = normalizeWebMCPResult(rawInspect) as { exists?: boolean };

      console.log("[mcpx-saga] compensation verification result =", normalizedInspect);

      if (normalizedInspect && normalizedInspect.exists === false) {
        appendEvent("DATABASE_COMPENSATION_VERIFIED", {
          operationKey: dbNode.operationKey,
          exists: false,
          verifiedOutcome: "Resource successfully absent from store",
        });

        setAuthoritativeState((prev) => ({
          ...prev,
          database: undefined,
        }));

        // 4. Mark COMPENSATED
        setTransaction((prev) => ({
          ...prev,
          state: "COMPENSATED",
          nodes: prev.nodes.map((n) =>
            n.id === "database:create" ? { ...n, state: "COMPENSATED" } : n
          ),
        }));
        appendEvent("TX_COMPENSATED", {
          transactionId: transaction.id,
          status: "Transaction fully rolled back and compensated.",
        });
      } else {
        throw new Error("Authoritative verification found resource still existing after delete.");
      }
    } catch (compErr: unknown) {
      const errMsg = compErr instanceof Error ? compErr.message : String(compErr);
      console.error("[mcpx-saga] compensation failed:", errMsg);
      setTransaction((prev) => ({
        ...prev,
        state: "FAILED",
        lastError: `Compensation failed: ${errMsg}`,
      }));
      appendEvent("COMPENSATION_FAILED", { error: errMsg });
    } finally {
      setIsRunning(false);
    }
  };

  const rejectCompensation = () => {
    setTransaction((prev) => ({
      ...prev,
      state: "FAILED",
      lastError: "Compensation rejected by operator. Resources retained in current state.",
    }));
    appendEvent("COMPENSATION_REJECTED_MANUAL_ATTENTION", {
      retainedResources: ["database:create"],
    });
  };

  const resetCompensationDemo = () => {
    setTransaction({
      id: "tx:demo-init",
      state: "CREATED",
      nodes: [
        {
          id: "database:create",
          label: "Database Service (create_database)",
          state: "PENDING",
          operationKey: "tx:init:database:create",
        },
        {
          id: "routing:create",
          label: "Routing Service (create_route)",
          state: "PENDING",
          operationKey: "tx:init:routing:create",
        },
      ],
    });
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
