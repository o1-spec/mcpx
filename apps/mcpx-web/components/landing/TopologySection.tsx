"use client";

import Link from "next/link";

interface TopologySectionProps {
  dagCompensating: boolean;
  setDagCompensating: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export default function TopologySection({ dagCompensating, setDagCompensating }: TopologySectionProps) {
  return (
    <div id="uncertainty-scrolly-section" className="border-t border-white/8 relative">
      <section
        id="reference-workflow"
        className="min-h-auto lg:min-h-screen py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto flex flex-col justify-center relative z-10"
      >
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
                [ 04 · REFERENCE TOPOLOGY ]
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
                Watch a distributed transaction fail safely.
              </h2>
              <p className="text-sm sm:text-base text-muted leading-relaxed">
                The included reference workflow runs across four independent WebMCP services to demonstrate cross-origin execution, reconciliation, and human-approved Saga rollback.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDagCompensating((prev) => !prev)}
                className="px-3.5 py-1.5 rounded font-mono text-xs bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
              >
                {dagCompensating ? "Reset execution" : "Trigger Saga compensation"}
              </button>
              <Link
                href="/app"
                className="px-3.5 py-1.5 rounded font-mono text-xs bg-foreground text-background hover:bg-white transition-colors"
              >
                Run in app
              </Link>
            </div>
          </div>

          {/* Blueprint DAG Schematic Canvas */}
          <div className="border border-white/9 bg-panel p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/6 pb-3 font-mono text-xs text-subtle">
              <span>TOPOLOGY // 4 SERVICES</span>
              <span>STATUS: {dagCompensating ? "COMPENSATED" : "ACTIVE"}</span>
            </div>

            {/* Node Layout */}
            <div className="space-y-4 max-w-lg mx-auto py-2 font-mono text-xs">
              {/* Node 1: Database */}
              <div className="dag-node-1 border border-white/8 bg-background p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-subtle block">[01] DATABASE</span>
                  <span className="text-foreground">create_database()</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs border ${
                    dagCompensating
                      ? "bg-white/4 text-subtle border-white/8"
                      : "bg-emerald-950/60 text-accent-lime border-accent-lime/30"
                  }`}
                >
                  {dagCompensating ? "COMPENSATED" : "✓ SUCCEEDED"}
                </span>
              </div>

              <div className="flex justify-center">
                <div className="h-5 w-px bg-white/10" />
              </div>

              {/* Node 2: Backend */}
              <div className="dag-node-2 border border-white/8 bg-background p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-subtle block">[02] BACKEND</span>
                  <span className="text-foreground">deploy_backend()</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs border ${
                    dagCompensating
                      ? "bg-white/4 text-subtle border-white/8"
                      : "bg-emerald-950/60 text-accent-lime border-accent-lime/30"
                  }`}
                >
                  {dagCompensating ? "COMPENSATED" : "✓ SUCCEEDED"}
                </span>
              </div>

              <div className="flex justify-center items-center gap-28 sm:gap-40 py-1">
                <span className="h-5 w-px bg-white/10 -rotate-25 transform origin-top" />
                <span className="h-5 w-px bg-white/10 rotate-25 transform origin-top" />
              </div>

              {/* Nodes 3 & 4: Routing & Frontend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="dag-node-3 border border-amber-500/40 bg-background p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-subtle">[03] ROUTING</span>
                    <span className="text-xs text-accent-lime">RECOVERED</span>
                  </div>
                  <div className="text-foreground">create_route()</div>
                </div>

                <div className="dag-node-4 border border-rose-500/40 bg-background p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-subtle">[04] FRONTEND</span>
                    <span className="text-xs text-rose-400">FAILED</span>
                  </div>
                  <div className="text-foreground">deploy_frontend()</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
