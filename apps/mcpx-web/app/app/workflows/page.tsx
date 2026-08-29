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
            className="px-4 py-2 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[12.5px] font-sans transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>+ Create Workflow</span>
          </Link>
        }
      />

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] pb-3 font-mono text-[12px]">
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            filterTab === "all"
              ? "bg-white/[0.08] text-[#F5F5F3] font-semibold"
              : "text-[#A0A0A4] hover:text-[#F5F5F3]"
          }`}
        >
          All ({workflows.length + 1})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("ready")}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            filterTab === "ready"
              ? "bg-white/[0.08] text-[#F5F5F3] font-semibold"
              : "text-[#A0A0A4] hover:text-[#F5F5F3]"
          }`}
        >
          Ready ({workflows.filter((w) => (w.nodes?.length || 0) > 0).length + 1})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("draft")}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            filterTab === "draft"
              ? "bg-white/[0.08] text-[#F5F5F3] font-semibold"
              : "text-[#A0A0A4] hover:text-[#F5F5F3]"
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
      <div className="border border-white/[0.08] bg-[#0B0C0E] overflow-hidden rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#66686D] text-[10.5px] uppercase bg-[#070708]">
                <th className="py-3 px-5 font-normal">Workflow Name</th>
                <th className="py-3 px-5 font-normal">Pipeline Steps</th>
                <th className="py-3 px-5 font-normal">Topology Flow</th>
                <th className="py-3 px-5 font-normal">Status</th>
                <th className="py-3 px-5 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {/* Built-in Reference Deployment Workflow */}
              {(filterTab === "all" || filterTab === "ready") && (
                <tr className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-3.5 px-5">
                    <div className="text-[#F5F5F3] font-bold font-sans text-[13px]">
                      Application Deployment DAG
                    </div>
                    <div className="text-[10.5px] text-[#66686D]">
                      Built-in 4-service reference pipeline
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-[#F5F5F3]">
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px]">
                      4 steps
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-[#A0A0A4] text-[11.5px]">
                    <span className="text-[#A5F36B]">Database</span> →{" "}
                    <span className="text-[#A5F36B]">Backend</span> → (
                    <span className="text-amber-300">Routing</span> |{" "}
                    <span className="text-cyan-300">Frontend</span>)
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusPill status="READY" size="sm" />
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      href="/app"
                      className="text-[#A5F36B] hover:text-white transition-colors text-[12px] font-medium"
                    >
                      Run in Overview →
                    </Link>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#66686D]">
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
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="text-[#F5F5F3] font-bold font-sans text-[13px]">
                        {wf.name}
                      </div>
                      <div className="text-[10.5px] text-[#66686D]">
                        {wf.createdAt
                          ? `Created ${new Date(wf.createdAt).toLocaleDateString()}`
                          : "Custom workflow"}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#F5F5F3]">
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px]">
                        {stepCount} steps
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#A0A0A4] text-[11.5px]">
                      {stepCount > 0 ? (
                        wf.nodes.map((n) => n.label).join(" → ")
                      ) : (
                        <span className="text-[#66686D] italic">No steps defined</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusPill status={isDraft ? "DRAFT" : "READY"} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-3">
                      <Link
                        href={`/app/workflows/${wf.id}`}
                        className="text-[#A5F36B] hover:text-white transition-colors text-[12px] font-medium"
                      >
                        Inspect →
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteWorkflow(wf.id, e)}
                        disabled={deletingId === wf.id}
                        className="text-[#66686D] hover:text-rose-400 transition-colors cursor-pointer text-[11px]"
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
