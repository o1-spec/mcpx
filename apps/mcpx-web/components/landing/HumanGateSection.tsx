"use client";

import Link from "next/link";

export default function HumanGateSection() {
  return (
    <section
      id="human-control"
      className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
    >
      <div className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
            [ SAFETY GATE ]
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
            Destructive rollback stays human-controlled.
          </h2>
          <p className="text-base text-muted leading-relaxed">
            When downstream steps fail, MCPx calculates safe reverse-order deletion and halts for human approval before removing live resources.
          </p>
        </div>

        {/* Operational Rollback State Panel */}
        <div className="border border-amber-500/40 bg-panel p-6 sm:p-8 font-mono text-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/6 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 font-bold uppercase">ROLLBACK APPROVAL REQUIRED</span>
            </div>
            <span className="text-muted">FAILED STEP: [04] FRONTEND (NEVER COMMITTED)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-white/6 bg-background space-y-2">
              <span className="text-xs text-subtle uppercase block">
                Resources currently present
              </span>
              <div className="space-y-1 text-foreground">
                <div className="text-accent-lime">✓ Database (PostgreSQL schema active)</div>
                <div className="text-accent-lime">✓ Backend (Compute runtime active)</div>
                <div className="text-accent-lime">✓ Routing (Gateway route active)</div>
                <div className="text-subtle pt-1">✕ Frontend (Never committed)</div>
              </div>
            </div>

            <div className="p-4 border border-white/6 bg-background space-y-2">
              <span className="text-xs text-subtle uppercase block">
                Proposed rollback sequence
              </span>
              <div className="space-y-1 text-foreground">
                <div>01 Routing gateway (delete_route)</div>
                <div>02 Compute backend (delete_backend)</div>
                <div>03 Database schema (CASCADE)</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/app"
              className="px-4 py-2 rounded bg-amber-400 hover:bg-amber-300 text-background font-bold text-xs transition-colors"
            >
              Approve rollback in app →
            </Link>
            <span className="text-subtle text-xs">
              Resources remain active until explicitly approved by operator
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
