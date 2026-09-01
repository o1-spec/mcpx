"use client";

import { useState } from "react";
import type { WorkflowRecord } from "@/lib/db";
import type { TransactionEvent } from "@/types/reliability";
import type { RegisteredTool } from "@/types/webmcp";
import type { RuntimeNodeState } from "@/components/workflows/WorkflowRuntimePipeline";
import type { EnrichedNode } from "@/components/workflows/WorkflowTopologyPanel";

async function resolveNativeTool(
  toolName: string,
  origin?: string,
  timeoutMs = 4000
): Promise<RegisteredTool> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (typeof document !== "undefined" && document.modelContext?.getTools) {
      try {
        const tools = await document.modelContext.getTools();
        const found = (tools || []).find((t) => {
          if (t.name !== toolName) return false;
          if (!origin || !t.origin) return true;
          const o1 = origin.replace(/\/$/, "");
          const o2 = t.origin.replace(/\/$/, "");
          return o1 === o2 || o1.includes(o2) || o2.includes(o1);
        });
        if (found) return found;
      } catch {
        // Retry
      }
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(
    `WebMCP tool '${toolName}' not found or service at ${origin || "origin"} not yet registered in document.modelContext.`
  );
}

export function useWorkflowRunner(
  workflow: WorkflowRecord | null,
  enrichedNodes: EnrichedNode[],
  onWorkflowCompleted?: () => void
) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [activeTxState, setActiveTxState] = useState<string | null>(null);
  const [runtimeNodes, setRuntimeNodes] = useState<RuntimeNodeState[]>([]);
  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);

  const handleRunWorkflow = async () => {
    if (!workflow) return;

    setPreflightError(null);

    // 1. Preflight Validation
    const missingContracts = enrichedNodes.filter((n) => !n.contract);
    if (missingContracts.length > 0) {
      setPreflightError(
        `Missing reliability contracts for: ${missingContracts.map((n) => n.label).join(", ")}. Please define contracts on the Service detail page.`
      );
      return;
    }

    // 2. Initialize Runtime Transaction in PostgreSQL
    setIsRunning(true);
    setEvents([]);
    setAwaitingApproval(false);

    const initialNodes: RuntimeNodeState[] = enrichedNodes.map((n) => ({
      id: n.id,
      label: n.label,
      service: n.service?.name || "Service",
      state: "PENDING",
      operationKey: `tx:${Date.now()}:${n.label.toLowerCase().replace(/\s+/g, "-")}`,
      origin: n.service?.origin || "",
      executeTool: n.contract?.executeToolName || "",
      inspectTool: n.contract?.inspectToolName || "",
      compensateTool: n.contract?.compensateToolName || null,
      operationKeyField: n.contract?.operationKeyField || "operationKey",
      dependencies: n.dependencies || [],
    }));

    setRuntimeNodes(initialNodes);

    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let createdTxId: string = txId;
    try {
      const initRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: txId,
          workflowId: workflow.id,
          scenario: workflow.name,
          nodes: initialNodes,
        }),
      });

      if (!initRes.ok) throw new Error("Failed to create transaction record in PostgreSQL");
      const initData = await initRes.json();
      createdTxId = initData.transaction.id;
      setActiveTxId(createdTxId);
      setActiveTxState("ACTIVE");
    } catch (err: unknown) {
      console.error("[mcpx-runner] init error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setPreflightError(`Transaction initialization failed: ${msg}`);
      setIsRunning(false);
      return;
    }

    const logEvent = (ev: TransactionEvent) => {
      setEvents((prev) => [...prev, ev]);
      fetch(`/api/transactions/${createdTxId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ev),
      }).catch(console.error);
    };

    logEvent({
      id: crypto.randomUUID(),
      sequence: 1,
      type: "TRANSACTION_STARTED",
      details: { workflowName: workflow.name, totalNodes: initialNodes.length },
      timestamp: new Date().toISOString(),
    });

    // 3. Dependency-Driven Topological Execution
    const nodeOutputs = new Map<string, Record<string, unknown>>();
    const completedNodeIds = new Set<string>();
    let currentNodes = [...initialNodes];

    const updateNodeState = async (
      nodeId: string,
      state: RuntimeNodeState["state"],
      extra?: Record<string, unknown>
    ) => {
      currentNodes = currentNodes.map((n) => (n.id === nodeId ? { ...n, state, ...extra } : n));
      setRuntimeNodes(currentNodes);

      await fetch(`/api/transactions/${createdTxId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          state,
          resourceId: extra?.resourceId,
          error: extra?.error,
        }),
      }).catch(console.error);

      const node = currentNodes.find((n) => n.id === nodeId);
      logEvent({
        id: crypto.randomUUID(),
        sequence: events.length + 1,
        nodeId,
        type: `NODE_${state}`,
        details: { label: node?.label, service: node?.service, ...extra },
        timestamp: new Date().toISOString(),
      });
    };

    const nodeStateMap = new Map(initialNodes.map((n) => [n.id, n]));

    while (completedNodeIds.size < currentNodes.length) {
      const runnable = Array.from(nodeStateMap.values()).filter(
        (n) => n.state === "PENDING" && n.dependencies.every((dep) => completedNodeIds.has(dep))
      );

      if (runnable.length === 0) {
        const anyFailed = Array.from(nodeStateMap.values()).some((n) => n.state === "FAILED");
        if (anyFailed) {
          setActiveTxState("AWAITING_COMPENSATION_APPROVAL");
          setAwaitingApproval(true);
          setIsRunning(false);
          return;
        }
        break;
      }

      for (const node of runnable) {
        await updateNodeState(node.id, "EXECUTING");

        await new Promise((r) => setTimeout(r, 600));

        try {
          if (!document.modelContext?.executeTool) {
            throw new Error("WebMCP document.modelContext unavailable");
          }

          const targetTool = await resolveNativeTool(node.executeTool, node.origin, 4000);

          const payload: Record<string, unknown> = {
            [node.operationKeyField]: node.operationKey,
          };

          for (const depId of node.dependencies) {
            const out = nodeOutputs.get(depId);
            if (out?.resourceId) {
              payload.widgetId = out.resourceId;
              payload.resourceId = out.resourceId;
            }
          }

          try {
            const result = await document.modelContext.executeTool(targetTool, JSON.stringify(payload));
            let parsed: Record<string, unknown> = {};
            try {
              parsed = JSON.parse(result?.content?.[0]?.text || "{}");
            } catch {
              parsed = {};
            }

            const resourceId = (parsed.resourceId || parsed.id || parsed.widgetId || node.operationKey) as string;
            nodeOutputs.set(node.id, { resourceId, ...parsed });
            await updateNodeState(node.id, "SUCCEEDED", { resourceId });
            completedNodeIds.add(node.id);
          } catch (execErr: unknown) {
            console.warn(`[mcpx-runner] node ${node.label} execute error:`, execErr);
            await updateNodeState(node.id, "IN_DOUBT", {
              reason: "Response not received or transport failure after dispatch",
            });

            await new Promise((r) => setTimeout(r, 500));
            await updateNodeState(node.id, "RECONCILING");

            const inspTool = await resolveNativeTool(node.inspectTool, node.origin, 4000);

            const inspRes = await document.modelContext.executeTool(
              inspTool,
              JSON.stringify({ [node.operationKeyField]: node.operationKey })
            );

            let inspParsed: Record<string, unknown> = {};
            try {
              inspParsed = JSON.parse(inspRes?.content?.[0]?.text || "{}");
            } catch {
              inspParsed = {};
            }

            if (inspParsed.exists) {
              const resId = (inspParsed.resourceId || inspParsed.id || node.operationKey) as string;
              nodeOutputs.set(node.id, { resourceId: resId, ...inspParsed });
              await updateNodeState(node.id, "RECOVERED", { resourceId: resId });
              completedNodeIds.add(node.id);
            } else {
              await updateNodeState(node.id, "FAILED", {
                error: execErr instanceof Error ? execErr.message : String(execErr),
              });
              setActiveTxState("AWAITING_COMPENSATION_APPROVAL");
              setAwaitingApproval(true);
              setIsRunning(false);
              return;
            }
          }
        } catch (err: unknown) {
          console.error(`[mcpx-runner] step '${node.label}' failed:`, err);
          const errorMsg = err instanceof Error ? err.message : String(err);
          await updateNodeState(node.id, "FAILED", { error: errorMsg });
          setActiveTxState("AWAITING_COMPENSATION_APPROVAL");
          setAwaitingApproval(true);
          setIsRunning(false);
          return;
        }
      }
    }

    setActiveTxState("COMMITTED");
    setIsRunning(false);
    onWorkflowCompleted?.();
  };

  const handleApproveRollback = async () => {
    if (!activeTxId) return;

    setAwaitingApproval(false);
    setIsRunning(true);
    setActiveTxState("COMPENSATING");

    const completedNodes = runtimeNodes
      .filter((n) => n.state === "SUCCEEDED" || n.state === "RECOVERED")
      .reverse();

    for (const node of completedNodes) {
      if (!node.compensateTool) continue;

      const updatedNodes = runtimeNodes.map((n) => (n.id === node.id ? { ...n, state: "COMPENSATING" as const } : n));
      setRuntimeNodes(updatedNodes);

      await new Promise((r) => setTimeout(r, 600));

      try {
        if (document.modelContext?.executeTool) {
          const compTool = await resolveNativeTool(node.compensateTool, node.origin, 4000);
          await document.modelContext.executeTool(
            compTool,
            JSON.stringify({ [node.operationKeyField]: node.operationKey })
          );
        }
      } catch (err) {
        console.warn(`[mcpx-compensate] error compensating ${node.label}:`, err);
      }

      setRuntimeNodes((prev) =>
        prev.map((n) => (n.id === node.id ? { ...n, state: "COMPENSATED" as const } : n))
      );

      setEvents((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sequence: prev.length + 1,
          nodeId: node.id,
          type: "NODE_COMPENSATED",
          details: { label: node.label, tool: node.compensateTool },
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setActiveTxState("COMPENSATED");
    setIsRunning(false);
    onWorkflowCompleted?.();
  };

  return {
    isRunning,
    activeTxId,
    activeTxState,
    runtimeNodes,
    events,
    awaitingApproval,
    setAwaitingApproval,
    preflightError,
    setPreflightError,
    setEvents,
    handleRunWorkflow,
    handleApproveRollback,
  };
}
