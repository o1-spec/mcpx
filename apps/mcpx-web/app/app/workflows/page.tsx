"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkflows } from "@/hooks/useWorkflows";
import PageHeader from "@/components/ui/PageHeader";
import StatusPill from "@/components/ui/StatusPill";
import EmptyState from "@/components/ui/EmptyState";

export default function WorkflowsPage() {
  const { workflows, loading } = useWorkflows();
  const [filterTab, setFilterTab] = useState<"all" | "ready" | "draft">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sort workflows newest first
  const sortedWorkflows = [...workflows].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const filteredWorkflows = sortedWorkflows.filter((wf) => {
    const isDraft = (wf.nodes?.length || 0) === 0;
    if (filterTab === "ready") return !isDraft;
    if (filterTab === "draft") return isDraft;
    return true;
  });

  const handleDeleteWorkflow = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    setDeletingId(id);
    try {
      await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete workflow:", err);
      alert("Failed to delete workflow");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Workflows Registry"
        description="Compose multi-service reliability contracts into dependency-aware, recoverable transaction pipelines."
        badge={`${workflows.length + 1} workflows`}
        actions={
          <Link
            href="/app/workflows/new"
            className="px-4 py-2 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>+ Create Workflow</span>
          </Link>
        }
      />

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-white/8 pb-3 font-mono text-xs">
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${filterTab === "all"
              ? "bg-white/8 text-foreground font-semibold"
              : "text-muted hover:text-foreground"
            }`}
        >
          All ({workflows.length + 1})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("ready")}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${filterTab === "ready"
              ? "bg-white/8 text-foreground font-semibold"
              : "text-muted hover:text-foreground"
            }`}
        >
          Ready ({workflows.filter((w) => (w.nodes?.length || 0) > 0).length + 1})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("draft")}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${filterTab === "draft"
              ? "bg-white/8 text-foreground font-semibold"
              : "text-muted hover:text-foreground"
            }`}
        >
          Drafts ({workflows.filter((w) => (w.nodes?.length || 0) === 0).length})
        </button>
      </div>

      {/* 3. Empty State if no custom workflows */}
      {filterTab === "draft" && filteredWorkflows.length === 0 && !loading && (
        <EmptyState
          title="No draft workflows"
          description="All created workflows currently have valid step pipelines configured and are ready for execution."
          actionText="Create a new workflow"
          actionHref="/app/workflows/new"
        />
      )}

      {/* 4. Dense Control Plane Workflows Table */}
      <div className="border border-white/8 bg-panel overflow-hidden rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-white/8 text-subtle text-xs uppercase bg-background">
                <th className="py-3 px-5 font-normal">Workflow Name</th>
                <th className="py-3 px-5 font-normal">Pipeline Steps</th>
                <th className="py-3 px-5 font-normal">Topology Flow</th>
                <th className="py-3 px-5 font-normal">Status</th>
                <th className="py-3 px-5 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {/* Built-in Reference Deployment Workflow */}
              {(filterTab === "all" || filterTab === "ready") && (
                <tr className="hover:bg-white/2 transition-colors group">
                  <td className="py-3.5 px-5">
                    <div className="text-foreground font-bold font-sans text-xs">
                      Application Deployment DAG
                    </div>
                    <div className="text-xs text-subtle">
                      Built-in 4-service reference pipeline
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-foreground">
                    <span className="px-2 py-0.5 rounded bg-white/4 border border-white/8 text-xs">
                      4 steps
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-muted text-xs">
                    <span className="text-accent-lime">Database</span> →{" "}
                    <span className="text-accent-lime">Backend</span> → (
                    <span className="text-amber-300">Routing</span> |{" "}
                    <span className="text-cyan-300">Frontend</span>)
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusPill status="READY" size="sm" />
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      href="/app"
                      className="text-accent-lime hover:text-foreground transition-colors text-xs font-medium"
                    >
                      Run in Overview →
                    </Link>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-subtle">
                    Loading custom workflows…
                  </td>
                </tr>
              )}

              {/* Custom Workflows */}
              {filteredWorkflows.map((wf) => {
                const stepCount = wf.nodes?.length || 0;
                const isDraft = stepCount === 0;

                return (
                  <tr
                    key={wf.id}
                    className="hover:bg-white/2 transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="text-foreground font-bold font-sans text-xs">
                        {wf.name}
                      </div>
                      <div className="text-xs text-subtle">
                        {wf.createdAt
                          ? `Created ${new Date(wf.createdAt).toLocaleDateString()}`
                          : "Custom workflow"}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-foreground">
                      <span className="px-2 py-0.5 rounded bg-white/4 border border-white/8 text-xs">
                        {stepCount} steps
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-muted text-xs">
                      {stepCount > 0 ? (
                        wf.nodes.map((n) => n.label).join(" → ")
                      ) : (
                        <span className="text-subtle italic">No steps defined</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusPill status={isDraft ? "DRAFT" : "READY"} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-3">
                      <Link
                        href={`/app/workflows/${wf.id}`}
                        className="text-accent-lime hover:text-foreground transition-colors text-xs font-medium"
                      >
                        Inspect →
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteWorkflow(wf.id, e)}
                        disabled={deletingId === wf.id}
                        className="text-subtle hover:text-rose-400 transition-colors cursor-pointer text-xs"
                        title="Delete workflow"
                      >
                        {deletingId === wf.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
