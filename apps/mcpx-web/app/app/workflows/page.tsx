"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkflows } from "@/hooks/useWorkflows";

export default function WorkflowsPage() {
  const { workflows, loading } = useWorkflows();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sort workflows newest first (by createdAt or id)
  const sortedWorkflows = [...workflows].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] sm:text-[19px] font-bold tracking-tight text-[#F2F3F1] font-display">
              Workflows
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#969B9E]">
              {workflows.length + 1} workflows
            </span>
          </div>
          <p className="text-[12.5px] text-[#969B9E] max-w-xl">
            Compose reliability contracts from connected WebMCP services into dependency-aware, recoverable transactions.
          </p>
        </div>

        <Link
          href="/app/workflows/new"
          className="px-4 py-2 rounded-md font-mono text-[12px] font-medium bg-[#F2F3F1] text-[#080A0B] hover:bg-white transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          Create workflow
        </Link>
      </div>

      {/* Dense Workflow Registry Table */}
      <div className="border border-white/[0.08] bg-[#0C0E0F]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[11.5px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#65696B] text-[10.5px] uppercase">
                <th className="py-3 px-4 font-normal">Workflow</th>
                <th className="py-3 px-4 font-normal">Steps</th>
                <th className="py-3 px-4 font-normal">Topology preview</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {/* Reference Deployment Workflow */}
              <tr className="hover:bg-white/[0.02] transition-colors bg-white/[0.01]">
                <td className="py-3 px-4">
                  <div className="text-[#F2F3F1] font-semibold">Application Deployment DAG</div>
                  <div className="text-[10px] text-[#65696B]">Built-in 4-service reference</div>
                </td>
                <td className="py-3 px-4 text-[#F2F3F1]">4 steps</td>
                <td className="py-3 px-4 text-[#969B9E] text-[11px]">
                  Database → Backend → (Routing | Frontend)
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 text-[#A5F36B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A5F36B]"></span>
                    <span>Ready</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link href="/app" className="text-[#A5F36B] hover:underline">
                    Run in overview →
                  </Link>
                </td>
              </tr>

              {loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#65696B]">
                    Loading custom workflows…
                  </td>
                </tr>
              )}

              {/* Custom Workflows */}
              {sortedWorkflows.map((wf) => {
                const stepCount = wf.nodes?.length || 0;
                const isDraft = stepCount === 0;

                return (
                  <tr key={wf.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-[#F2F3F1] font-semibold">{wf.name}</div>
                      <div className="text-[10px] text-[#65696B]">
                        {wf.createdAt ? new Date(wf.createdAt).toLocaleDateString() : "Custom workflow"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#F2F3F1]">{stepCount} steps</td>
                    <td className="py-3 px-4 text-[#969B9E] text-[11px]">
                      {stepCount > 0 ? (
                        wf.nodes.map((n) => n.label).join(" → ")
                      ) : (
                        <span className="text-[#65696B] italic">No steps defined</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isDraft ? (
                        <span className="inline-flex items-center gap-1.5 text-[#65696B]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#65696B]"></span>
                          <span>Draft</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[#A5F36B]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#A5F36B]"></span>
                          <span>Ready</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-3">
                      <Link
                        href={`/app/workflows/${wf.id}`}
                        className="text-[#A5F36B] hover:underline"
                      >
                        Open →
                      </Link>
                      <button
                        onClick={(e) => handleDeleteWorkflow(wf.id, e)}
                        disabled={deletingId === wf.id}
                        className="text-[#65696B] hover:text-rose-400 transition-colors cursor-pointer text-[10.5px]"
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
