"use client";

import Link from "next/link";
import AppNav from "@/components/services/AppNav";
import { useWorkflows } from "@/hooks/useWorkflows";

export default function WorkflowsPage() {
  const { workflows, loading } = useWorkflows();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <AppNav />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Workflows
            </h1>
            <p className="text-xs text-slate-400">
              Compose reliability contracts from your WebMCP services into durable multi-step transactions.
            </p>
          </div>

          <Link
            href="/app/workflows/new"
            className="px-4 py-2 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            Create workflow
          </Link>
        </div>

        {/* Section A: Your Workflows */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Your workflows ({workflows.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Loading custom workflows…
            </div>
          ) : workflows.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 text-center space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-300 block">
                  No custom workflows created yet
                </span>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Combine reliability contracts from your connected WebMCP services into an executable, recoverable DAG.
                </p>
              </div>

              <div className="pt-1">
                <Link
                  href="/app/workflows/new"
                  className="px-4 py-2 rounded-lg font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-block cursor-pointer"
                >
                  Create workflow
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800/80 bg-slate-900/20 overflow-hidden">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <h3 className="text-sm font-semibold text-white font-sans">
                        {wf.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        Ready
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[11px] text-slate-400">
                      <span>{wf.nodes.length} steps</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300 font-sans">
                        {wf.nodes.map((n) => n.label).join(" → ")}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/app/workflows/${wf.id}`}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    View workflow →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section B: Reference Workflow */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Reference workflow
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Built-in reference implementation for verifying multi-service uncertainty recovery and Saga rollback.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              4 reference apps
            </span>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <h3 className="text-xs font-semibold text-white">
                  Application Deployment DAG
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Database (Postgres) → Backend (Compute) → (Routing gateway ∥ Frontend preview)
              </p>
            </div>

            <Link
              href="/app"
              className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
            >
              Run reference workflow →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
