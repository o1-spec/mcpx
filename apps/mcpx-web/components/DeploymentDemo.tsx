"use client";

import type {
  TransactionModel,
  TransactionEvent,
  TransactionState,
} from "@/types/reliability";
import type { FourServiceAuthoritativeState } from "@/hooks/useDeploymentDemo";
import DeploymentDAG from "@/components/deployment/DeploymentDAG";
import EventLogList from "@/components/reliability/EventLogList";

interface DeploymentDemoProps {
  transaction: TransactionModel;
  isRunning: boolean;
  isConnected: boolean;
  eventLog: TransactionEvent[];
  authoritativeState: FourServiceAuthoritativeState;
  onRunDeployment: () => void;
  onInspectAll: () => void;
  onReset: () => void;
  onClearLog: () => void;
}

const txStateColors: Record<TransactionState, string> = {
  CREATED: "bg-slate-800 text-slate-400 border-slate-700",
  EXECUTING: "bg-cyan-950 text-cyan-300 border-cyan-500/50 animate-pulse",
  COMMITTED: "bg-emerald-950 text-emerald-300 border-emerald-500/50 font-bold",
  ABORTING: "bg-amber-950 text-amber-300 border-amber-500/60 animate-pulse",
  AWAITING_COMPENSATION_APPROVAL: "bg-amber-900 text-amber-100 border-amber-400 font-bold",
  COMPENSATING: "bg-indigo-950 text-indigo-300 border-indigo-500/60 animate-pulse",
  COMPENSATED: "bg-emerald-950 text-emerald-300 border-emerald-500/60 font-bold",
  FAILED: "bg-rose-950 text-rose-300 border-rose-500/60 font-bold",
};

export default function DeploymentDemo({
  transaction,
  isRunning,
  isConnected,
  eventLog,
  authoritativeState,
  onRunDeployment,
  onInspectAll,
  onReset,
  onClearLog,
}: DeploymentDemoProps) {
  const isCommitted = transaction.state === "COMMITTED";

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 via-slate-900/60 to-slate-900/60 p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              4-Service Full Deployment DAG
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Declarative DAG Scheduling & Dynamic Resource Binding via WebMCP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${
              txStateColors[transaction.state]
            }`}
          >
            TX: {transaction.state.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Visual DAG */}
      <DeploymentDAG transaction={transaction} />

      {/* Grid: Actions & Authoritative Inspector on Left, Event Log on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Action Buttons */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onRunDeployment}
                disabled={isRunning || !isConnected}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Executing 4-Node DAG...
                  </span>
                ) : (
                  <span>[ RUN DEPLOYMENT ]</span>
                )}
              </button>

              <button
                onClick={onInspectAll}
                disabled={isRunning}
                className="py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Inspect All
              </button>

              <button
                onClick={onReset}
                disabled={isRunning}
                className="py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Authoritative Resource Inspector */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300 font-sans">
                Authoritative Resource Inspector
              </span>
              <span className="text-[10px] text-slate-500">4 Microservices</span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Database Resource:</span>
                <span className={authoritativeState.database ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                  {authoritativeState.database ? `PRESENT (${authoritativeState.database.id.slice(0, 8)}...)` : "ABSENT"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Backend Compute:</span>
                <span className={authoritativeState.backend ? "text-indigo-400 font-semibold" : "text-slate-500"}>
                  {authoritativeState.backend ? `PRESENT (${authoritativeState.backend.id.slice(0, 8)}...)` : "ABSENT"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Routing Entry:</span>
                <span className={authoritativeState.routing ? "text-cyan-400 font-semibold" : "text-slate-500"}>
                  {authoritativeState.routing ? `PRESENT (${authoritativeState.routing.id.slice(0, 8)}...)` : "ABSENT"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Frontend Preview:</span>
                <span className={authoritativeState.frontend ? "text-violet-400 font-semibold" : "text-slate-500"}>
                  {authoritativeState.frontend ? `PRESENT (${authoritativeState.frontend.id.slice(0, 8)}...)` : "ABSENT"}
                </span>
              </div>

              {isCommitted && (
                <div className="pt-2 text-emerald-400 text-[11px] font-sans font-medium flex items-center gap-1.5">
                  <span>✓</span> Transaction committed. All 4 resources authoritatively verified in store.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Event Log */}
        <EventLogList eventLog={eventLog} onClearLog={onClearLog} />
      </div>
    </section>
  );
}
