"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/services/AppNav";
import WebMCPServiceFrame from "@/components/services/WebMCPServiceFrame";
import EventTimeline from "@/components/reliability/EventTimeline";
import ApprovalCard from "@/components/compensation/ApprovalCard";
import type { WorkflowRecord, WorkflowNodeRecord, ReliabilityContractRecord, ConnectedServiceRecord } from "@/lib/db";
import type { TransactionEvent } from "@/types/reliability";

interface EnrichedNode extends WorkflowNodeRecord {
  contract?: ReliabilityContractRecord;
  service?: ConnectedServiceRecord;
}

interface RuntimeNodeState {
  id: string;
  label: string;
  service: string;
  state: "PENDING" | "EXECUTING" | "SUCCEEDED" | "IN_DOUBT" | "RECONCILING" | "RECOVERED" | "FAILED" | "COMPENSATING" | "COMPENSATED";
  resourceId?: string;
  error?: string;
  operationKey: string;
  origin: string;
  executeTool: string;
  inspectTool: string;
  compensateTool?: string | null;
  operationKeyField: string;
  dependencies: string[];
}

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [workflow, setWorkflow] = useState<WorkflowRecord | null>(null);
  const [enrichedNodes, setEnrichedNodes] = useState<EnrichedNode[]>([]);
  const [recentRuns, setRecentRuns] = useState<Array<{ id: string; state: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [activeTxState, setActiveTxState] = useState<string | null>(null);
  const [runtimeNodes, setRuntimeNodes] = useState<RuntimeNodeState[]>([]);
  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workflows/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Workflow not found");
      const data = await res.json();
      setWorkflow(data.workflow);
      setEnrichedNodes(data.workflow.nodes || []);
      setRecentRuns(data.recentRuns || []);
    } catch (err: unknown) {
      console.error("[mcpx-wf-detail] load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load workflow");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  // Unique participating origins for offscreen WebMCP frames
  const uniqueOrigins = Array.from(
    new Set(enrichedNodes.map((n) => n.service?.origin).filter(Boolean) as string[])
  );

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/workflows/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete workflow");
      router.push("/app/workflows");
    } catch (err: unknown) {
      console.error("[mcpx-wf-detail] delete error:", err);
      alert(err instanceof Error ? err.message : "Delete failed");
      setIsDeleting(false);
    }
  };

  // Run Custom Workflow Engine
  const handleRunWorkflow = async () => {
    if (!workflow) return;

    try {
      setIsRunning(true);
      setEvents([]);
      setAwaitingApproval(false);

      // 1. Compile workflow into standard transaction nodes
      const compileRes = await fetch(`/api/workflows/${encodeURIComponent(id)}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: `Workflow: ${workflow.name}` }),
      });

      if (!compileRes.ok) {
        const body = await compileRes.json().catch(() => ({}));
        throw new Error(body.error || "Failed to compile workflow");
      }

      const compileData = await compileRes.json();
      const { transactionId, nodes } = compileData;
      setActiveTxId(transactionId);
      setActiveTxState("EXECUTING");

      const initialRuntimeNodes: RuntimeNodeState[] = nodes.map((n: RuntimeNodeState) => ({
        ...n,
        state: "PENDING",
      }));
      setRuntimeNodes(initialRuntimeNodes);

      // Log initial event
      logEvent({
        id: crypto.randomUUID(),
        sequence: 1,
        nodeId: undefined,
        type: "WORKFLOW_EXECUTION_STARTED",
        details: { workflowId: workflow.id, workflowName: workflow.name, stepCount: nodes.length },
        timestamp: new Date().toISOString(),
      });

      // Execute DAG topologically in browser
      await executeWorkflowDAG(transactionId, initialRuntimeNodes);
    } catch (err: unknown) {
      console.error("[mcpx-wf-runner] execution error:", err);
      setActiveTxState("FAILED");
      logEvent({
        id: crypto.randomUUID(),
        sequence: events.length + 1,
        nodeId: undefined,
        type: "WORKFLOW_EXECUTION_FAILED",
        details: { error: err instanceof Error ? err.message : String(err) },
        timestamp: new Date().toISOString(),
      });
      setIsRunning(false);
    }
  };

  const logEvent = (event: TransactionEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  // Generic DAG execution loop using browser WebMCP document.modelContext
  const executeWorkflowDAG = async (txId: string, currentNodes: RuntimeNodeState[]) => {
    const nodeStateMap = new Map<string, RuntimeNodeState>(currentNodes.map((n) => [n.id, { ...n }]));
    const completedNodeIds = new Set<string>();

    const updateNodeState = async (
      nodeId: string,
      state: RuntimeNodeState["state"],
      extra?: { resourceId?: string; error?: string }
    ) => {
      const node = nodeStateMap.get(nodeId);
      if (!node) return;
      node.state = state;
      if (extra?.resourceId) node.resourceId = extra.resourceId;
      if (extra?.error) node.error = extra.error;
      nodeStateMap.set(nodeId, { ...node });
      setRuntimeNodes(Array.from(nodeStateMap.values()));

      // Sync with Postgres atomic transition API
      await fetch(`/api/transactions/${encodeURIComponent(txId)}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          nodeState: state,
          resourceId: extra?.resourceId,
          lastError: extra?.error,
          eventType: `NODE_${state}`,
          eventPayload: { nodeLabel: node.label, service: node.service, ...extra },
        }),
      }).catch((e) => console.warn("[mcpx] transition sync warning:", e));

      logEvent({
        id: crypto.randomUUID(),
        sequence: events.length + 1,
        nodeId,
        type: `NODE_${state}`,
        details: { label: node.label, service: node.service, ...extra },
        timestamp: new Date().toISOString(),
      });
    };

    while (completedNodeIds.size < currentNodes.length) {
      // Find runnable nodes whose dependencies are completed
      const runnable = Array.from(nodeStateMap.values()).filter(
        (n) => n.state === "PENDING" && n.dependencies.every((dep) => completedNodeIds.has(dep))
      );

      if (runnable.length === 0) {
        // If no nodes are runnable and some are failed, break
        const anyFailed = Array.from(nodeStateMap.values()).some((n) => n.state === "FAILED");
        if (anyFailed) {
          setActiveTxState("AWAITING_COMPENSATION_APPROVAL");
          setAwaitingApproval(true);
          setIsRunning(false);
          return;
        }
        break;
      }

      // Execute runnable nodes
      for (const node of runnable) {
        await updateNodeState(node.id, "EXECUTING");

        // Small execution delay for visual clarity
        await new Promise((r) => setTimeout(r, 600));

        try {
          if (!document.modelContext?.executeTool) {
            throw new Error("WebMCP document.modelContext unavailable");
          }

          const tools = await document.modelContext.getTools({ fromOrigins: [node.origin] });
          const targetTool = tools.find((t) => t.name === node.executeTool);

          if (!targetTool) {
            throw new Error(`Tool '${node.executeTool}' not exposed by ${node.origin}`);
          }

          const payload = {
            [node.operationKeyField]: node.operationKey,
          };

          const result = await document.modelContext.executeTool(targetTool, JSON.stringify(payload));
          let parsed: Record<string, unknown> = {};
          try {
            parsed = JSON.parse(result?.content?.[0]?.text || "{}");
          } catch {
            parsed = {};
          }

          const resourceId = (parsed.resourceId || parsed.id || parsed.widgetId || node.operationKey) as string;
          await updateNodeState(node.id, "SUCCEEDED", { resourceId });
          completedNodeIds.add(node.id);
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
    loadWorkflow();
  };

  // Reverse Compensation execution
  const handleApproveRollback = async () => {
    if (!activeTxId) return;

    setAwaitingApproval(false);
    setIsRunning(true);
    setActiveTxState("COMPENSATING");

    // Compensate succeeded nodes in reverse order
    const completedNodes = runtimeNodes
      .filter((n) => n.state === "SUCCEEDED" || n.state === "RECOVERED")
      .reverse();

    for (const node of completedNodes) {
      if (!node.compensateTool) continue;

      // Update state to COMPENSATING
      const updatedNodes = runtimeNodes.map((n) => (n.id === node.id ? { ...n, state: "COMPENSATING" as const } : n));
      setRuntimeNodes(updatedNodes);

      await new Promise((r) => setTimeout(r, 600));

      try {
        if (document.modelContext?.executeTool) {
          const tools = await document.modelContext.getTools({ fromOrigins: [node.origin] });
          const compTool = tools.find((t) => t.name === node.compensateTool);
          if (compTool) {
            await document.modelContext.executeTool(
              compTool,
              JSON.stringify({ [node.operationKeyField]: node.operationKey })
            );
          }
        }
      } catch (err) {
        console.warn(`[mcpx-compensate] error compensating ${node.label}:`, err);
      }

      setRuntimeNodes((prev) =>
        prev.map((n) => (n.id === node.id ? { ...n, state: "COMPENSATED" as const } : n))
      );

      logEvent({
        id: crypto.randomUUID(),
        sequence: events.length + 1,
        nodeId: node.id,
        type: "NODE_COMPENSATED",
        details: { label: node.label, tool: node.compensateTool },
        timestamp: new Date().toISOString(),
      });
    }

    setActiveTxState("COMPENSATED");
    setIsRunning(false);
    loadWorkflow();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <AppNav />
          <div className="py-12 text-center text-xs text-slate-500">
            Loading workflow details…
          </div>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <AppNav />
          <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 space-y-3">
            <h2 className="font-semibold text-sm">Workflow not found</h2>
            <p className="text-slate-400">{error || "Could not retrieve workflow."}</p>
            <Link href="/app/workflows" className="text-indigo-400 hover:text-indigo-300 font-medium inline-block">
              ← Back to Workflows
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <AppNav />

        {/* Dynamic Offscreen WebMCP Service Frames */}
        {uniqueOrigins.map((orig) => (
          <WebMCPServiceFrame key={orig} origin={orig} />
        ))}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/app/workflows" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                ← Workflows
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                {workflow.name}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                Ready
              </span>
            </div>
            {workflow.description && (
              <p className="text-xs text-slate-400 max-w-xl">{workflow.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleRunWorkflow}
              disabled={isRunning}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRunning ? "Running workflow…" : "Run workflow"}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 text-rose-300 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteConfirm && (
          <div className="p-5 rounded-2xl border border-rose-500/40 bg-rose-950/30 space-y-3">
            <h3 className="text-sm font-semibold text-white">Delete this workflow definition?</h3>
            <p className="text-xs text-slate-300">Existing transaction history will remain intact in PostgreSQL.</p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Confirm delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Live Transaction Runtime DAG (if run or active) */}
        {activeTxId && (
          <section className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
                  Active transaction
                </span>
                <span className="text-[11px] font-mono text-indigo-300">{activeTxId}</span>
              </div>
              <span
                className={`text-xs font-mono px-2.5 py-0.5 rounded border ${
                  activeTxState === "COMMITTED" || activeTxState === "COMPENSATED"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                    : activeTxState === "AWAITING_COMPENSATION_APPROVAL"
                    ? "bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse"
                    : "bg-indigo-950/80 text-indigo-300 border-indigo-500/40"
                }`}
              >
                {activeTxState}
              </span>
            </div>

            {/* Dynamic Step Nodes Visual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {runtimeNodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-4 rounded-xl border transition-colors space-y-2 ${
                    node.state === "SUCCEEDED" || node.state === "RECOVERED"
                      ? "border-emerald-500/40 bg-emerald-950/20"
                      : node.state === "COMPENSATED"
                      ? "border-slate-700 bg-slate-950/60"
                      : node.state === "FAILED"
                      ? "border-rose-500/40 bg-rose-950/20"
                      : node.state === "EXECUTING"
                      ? "border-indigo-500/60 bg-indigo-950/30 animate-pulse"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{node.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        node.state === "SUCCEEDED" || node.state === "RECOVERED"
                          ? "bg-emerald-950 text-emerald-300"
                          : node.state === "COMPENSATED"
                          ? "bg-slate-800 text-slate-400"
                          : node.state === "FAILED"
                          ? "bg-rose-950 text-rose-300"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {node.state}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    <div>{node.service}</div>
                    <div className="text-slate-500 truncate">{node.operationKey}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Safety Gate Intervention Card */}
            {awaitingApproval && (
              <ApprovalCard
                onApprove={handleApproveRollback}
                onReject={() => setAwaitingApproval(false)}
                disabled={isRunning}
              />
            )}

            {/* Event Timeline */}
            <div className="pt-4 border-t border-slate-800/60">
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider block mb-3">
                Durable event history
              </span>
              <EventTimeline eventLog={events} onClearLog={() => setEvents([])} />
            </div>
          </section>
        )}

        {/* Workflow Static Definition & Steps DAG */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Workflow definition ({enrichedNodes.length} steps)
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Generic DAG model
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
            {enrichedNodes.map((node, idx) => (
              <div key={node.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-300">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-white">{node.label}</h3>
                    <span className="text-[10px] font-mono text-slate-500">
                      ({node.service?.name || "Service"})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-[11px] text-slate-400">
                    <span className="text-emerald-400">{node.contract?.executeToolName}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-cyan-400">{node.contract?.inspectToolName}</span>
                    {node.contract?.compensateToolName && (
                      <>
                        <span className="text-slate-600">→</span>
                        <span className="text-rose-400">{node.contract?.compensateToolName}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-400 text-right">
                  <span className="text-[11px] text-slate-500 block">
                    {node.dependencies.length > 0
                      ? `Depends on: ${node.dependencies.join(", ")}`
                      : "Root step"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Runs */}
        {recentRuns.length > 0 && (
          <section className="space-y-3 pt-4 border-t border-slate-800/80">
            <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Recent runs ({recentRuns.length})
            </h2>

            <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden text-xs">
              {recentRuns.map((run) => (
                <div key={run.id} className="p-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono text-indigo-300 block">{run.id}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      run.state === "COMMITTED" || run.state === "COMPENSATED"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    {run.state}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
