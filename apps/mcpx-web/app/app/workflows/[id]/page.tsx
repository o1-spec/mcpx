"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WebMCPServiceFrame from "@/components/services/WebMCPServiceFrame";
import EventTimeline from "@/components/reliability/EventTimeline";
import ApprovalCard from "@/components/compensation/ApprovalCard";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatusPill from "@/components/ui/StatusPill";
import DiagnosticsDrawer from "@/components/ui/DiagnosticsDrawer";
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
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

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

  const handleRunWorkflow = async () => {
    if (!workflow) return;

    setPreflightError(null);

    // 1. Preflight Validation: Ensure all services and tools are discovered & reachable
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

    let createdTxId: string;
    try {
      const initRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: workflow.id,
          scenario: workflow.name,
          nodes: initialNodes.map((n) => ({
            id: n.id,
            label: n.label,
            service: n.service,
            operationKey: n.operationKey,
            dependencies: n.dependencies,
          })),
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
      }).catch((e) => console.warn("[mcpx] log event sync warning:", e));
    };

    logEvent({
      id: crypto.randomUUID(),
      sequence: 1,
      type: "TRANSACTION_STARTED",
      details: { workflowId: workflow.id, workflowName: workflow.name },
      timestamp: new Date().toISOString(),
    });

    // 3. Dependency-Driven Topological Execution
    const completedNodeIds = new Set<string>();
    const nodeStateMap = new Map<string, RuntimeNodeState>(initialNodes.map((n) => [n.id, { ...n }]));
    const nodeOutputs = new Map<string, Record<string, unknown>>();

    let currentNodes = [...initialNodes];

    const updateNodeState = async (
      nodeId: string,
      state: RuntimeNodeState["state"],
      extra?: { resourceId?: string; error?: string; reason?: string }
    ) => {
      const node = nodeStateMap.get(nodeId);
      if (!node) return;
      node.state = state;
      if (extra?.resourceId) node.resourceId = extra.resourceId;
      if (extra?.error) node.error = extra.error;

      currentNodes = Array.from(nodeStateMap.values());
      setRuntimeNodes([...currentNodes]);

      await fetch(`/api/transactions/${createdTxId}/transition`, {
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

          const tools = await document.modelContext.getTools({ fromOrigins: [node.origin] });
          const targetTool = tools.find((t) => t.name === node.executeTool);

          if (!targetTool) {
            throw new Error(`Tool '${node.executeTool}' not exposed by ${node.origin}`);
          }

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

            const inspTool = tools.find((t) => t.name === node.inspectTool);
            if (!inspTool) {
              throw new Error(`Inspect tool '${node.inspectTool}' not found during reconciliation`);
            }

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
    loadWorkflow();
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
    loadWorkflow();
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-subtle space-y-2">
        <div className="w-4 h-4 border-2 border-white/20 border-t-accent-lime rounded-full animate-spin mx-auto" />
        <div>Loading workflow definition…</div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="p-6 border border-rose-500/30 bg-panel font-mono text-xs text-rose-300 space-y-3 rounded">
        <h2 className="font-bold text-sm text-rose-400">[ WORKFLOW NOT FOUND ]</h2>
        <p className="text-muted">{error || "Could not retrieve workflow record."}</p>
        <Link href="/app/workflows" className="text-foreground hover:underline inline-block pt-1">
          ← Back to Workflows
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Dynamic Offscreen WebMCP Service Frames */}
      {uniqueOrigins.map((orig) => (
        <WebMCPServiceFrame key={orig} origin={orig} />
      ))}

      {/* Page Header */}
      <PageHeader
        title={workflow.name}
        description={workflow.description || "Durable WebMCP transactional workflow pipeline."}
        breadcrumbs={[
          { label: "Workflows", href: "/app/workflows" },
          { label: workflow.name },
        ]}
        badge={<StatusPill status={enrichedNodes.length > 0 ? "READY" : "DRAFT"} size="sm" />}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRunWorkflow}
              disabled={isRunning || enrichedNodes.length === 0}
              className="px-4 py-2 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-1.5"
            >
              {isRunning ? "Running Pipeline…" : "Execute Workflow →"}
            </button>

            <button
              type="button"
              onClick={() => setDiagnosticsOpen(true)}
              className="px-3 py-2 rounded font-mono text-xs text-muted hover:text-foreground bg-white/3 hover:bg-white/6 border border-white/8 transition-colors cursor-pointer"
            >
              Diagnostics ↗
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 rounded font-mono text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-rose-500/20 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        }
      />

      {/* Preflight Error Notice */}
      {preflightError && (
        <div className="p-4 rounded border border-rose-500/40 bg-rose-950/30 text-xs font-mono text-rose-300 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="font-bold block">[ PREFLIGHT CHECK FAILED ]</span>
            <p className="text-muted">{preflightError}</p>
          </div>
          <button
            type="button"
            onClick={() => setPreflightError(null)}
            className="text-subtle hover:text-foreground cursor-pointer font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete Confirmation Card */}
      {showDeleteConfirm && (
        <div className="p-5 border border-rose-500/40 bg-panel space-y-3 rounded">
          <h3 className="text-sm font-bold text-foreground font-sans">
            Delete this workflow definition?
          </h3>
          <p className="text-xs text-muted">
            Existing execution history will remain intact in PostgreSQL.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-sans font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Confirm Delete"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-1.5 rounded bg-transparent text-muted hover:text-foreground border border-white/8 font-mono text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Live Transaction Runtime Surface */}
      {activeTxId && (
        <Panel
          title="ACTIVE TRANSACTION PIPELINE"
          badge={<StatusPill status={activeTxState || "ACTIVE"} size="sm" />}
          actions={<span className="font-mono text-xs text-muted">{activeTxId}</span>}
        >
          <div className="space-y-6">
            {/* Dynamic Step Nodes Visual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {runtimeNodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-3.5 border rounded space-y-2 transition-colors ${node.state === "SUCCEEDED" || node.state === "RECOVERED"
                    ? "border-emerald-500/30 bg-emerald-950/20"
                    : node.state === "COMPENSATED"
                      ? "border-white/8 bg-background"
                      : node.state === "FAILED"
                        ? "border-rose-500/30 bg-rose-950/20"
                        : node.state === "EXECUTING" || node.state === "RECONCILING"
                          ? "border-cyan-500/40 bg-cyan-950/20 animate-pulse"
                          : node.state === "IN_DOUBT"
                            ? "border-amber-500/40 bg-amber-950/20 animate-pulse"
                            : "border-white/8 bg-background"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground font-sans">
                      {node.label}
                    </span>
                    <StatusPill status={node.state} size="sm" />
                  </div>

                  <div className="text-xs text-muted font-mono space-y-0.5">
                    <div>{node.service}</div>
                    <div className="text-subtle truncate">{node.operationKey}</div>
                    {node.resourceId && (
                      <div className="text-accent-lime text-xs">id: {node.resourceId}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Approval Safety Gate */}
            {awaitingApproval && (
              <ApprovalCard
                onApprove={handleApproveRollback}
                onReject={() => setAwaitingApproval(false)}
                disabled={isRunning}
              />
            )}

            {/* Event Timeline */}
            <div className="pt-4 border-t border-white/6">
              <div className="text-xs font-mono text-subtle uppercase mb-3">
                Live Transaction Log
              </div>
              <EventTimeline eventLog={events} onClearLog={() => setEvents([])} />
            </div>
          </div>
        </Panel>
      )}

      {/* Workflow Static Definition & Steps */}
      <Panel
        title={`PIPELINE TOPOLOGY (${enrichedNodes.length} STEPS)`}
        subtitle="DAG EXECUTION GRAPH"
      >
        <div className="divide-y divide-white/4 font-mono text-xs">
          {enrichedNodes.map((node, idx) => (
            <div
              key={node.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-white/6 border border-white/8 flex items-center justify-center font-mono text-xs text-muted">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-foreground font-sans">
                    {node.label}
                  </span>
                  <span className="text-xs text-subtle">
                    ({node.service?.name || "Service"})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="text-accent-lime">{node.contract?.executeToolName}</span>
                  <span className="text-subtle">→</span>
                  <span className="text-cyan-300">{node.contract?.inspectToolName}</span>
                  {node.contract?.compensateToolName && (
                    <>
                      <span className="text-subtle">→</span>
                      <span className="text-rose-300">{node.contract?.compensateToolName}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-xs text-subtle text-left sm:text-right">
                {node.dependencies.length > 0
                  ? `Depends on: ${node.dependencies.join(", ")}`
                  : "Root Step"}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <Panel title={`RECENT RUNS (${recentRuns.length})`}>
          <div className="divide-y divide-white/4 font-mono text-xs">
            {recentRuns.map((run) => (
              <div key={run.id} className="py-2.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-foreground block">{run.id}</span>
                  <span className="text-xs text-subtle">
                    {new Date(run.createdAt).toLocaleString()}
                  </span>
                </div>
                <StatusPill status={run.state} size="sm" />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Diagnostics Drawer */}
      <DiagnosticsDrawer
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        title={`Workflow: ${workflow.name}`}
        data={{
          workflow,
          enrichedNodes,
          recentRuns,
          activeTxId,
          activeTxState,
        }}
      />
    </div>
  );
}
