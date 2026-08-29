"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WebMCPServiceFrame from "@/components/services/WebMCPServiceFrame";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatusPill from "@/components/ui/StatusPill";
import DiagnosticsDrawer from "@/components/ui/DiagnosticsDrawer";
import WorkflowHeaderActions from "@/components/workflows/WorkflowHeaderActions";
import WorkflowRuntimePipeline from "@/components/workflows/WorkflowRuntimePipeline";
import WorkflowTopologyPanel, { type EnrichedNode } from "@/components/workflows/WorkflowTopologyPanel";
import { useWorkflowRunner } from "@/hooks/useWorkflowRunner";
import type { WorkflowRecord } from "@/lib/db";

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
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

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

  const {
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
  } = useWorkflowRunner(workflow, enrichedNodes, loadWorkflow);

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
          <WorkflowHeaderActions
            isRunning={isRunning}
            stepCount={enrichedNodes.length}
            onRunWorkflow={handleRunWorkflow}
            onOpenDiagnostics={() => setDiagnosticsOpen(true)}
            onDeletePrompt={() => setShowDeleteConfirm(true)}
          />
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
        <WorkflowRuntimePipeline
          activeTxId={activeTxId}
          activeTxState={activeTxState}
          runtimeNodes={runtimeNodes}
          awaitingApproval={awaitingApproval}
          isRunning={isRunning}
          events={events}
          onApproveRollback={handleApproveRollback}
          onRejectApproval={() => setAwaitingApproval(false)}
          onClearEvents={() => setEvents([])}
        />
      )}

      {/* Workflow Pipeline Topology */}
      <WorkflowTopologyPanel enrichedNodes={enrichedNodes} />

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
