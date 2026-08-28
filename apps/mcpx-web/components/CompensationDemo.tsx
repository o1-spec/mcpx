"use client";

import type {
  TransactionModel,
  TransactionEvent,
  AuthoritativeState,
  TransactionState,
} from "@/types/reliability";
import TransactionDAG from "@/components/compensation/TransactionDAG";
import ApprovalCard from "@/components/compensation/ApprovalCard";
import EventLogList from "@/components/reliability/EventLogList";

interface CompensationDemoProps {
  transaction: TransactionModel;
  isRunning: boolean;
  isConnected: boolean;
  eventLog: TransactionEvent[];
  authoritativeState: AuthoritativeState;
  onRunDemo: () => void;
  onApproveCompensation: () => void;
  onRejectCompensation: () => void;
  onResetDemo: () => void;
  onClearLog: () => void;
}

const txStateColors: Record<TransactionState, string> = {
  CREATED: "bg-slate-800 text-slate-400 border-slate-700",
  EXECUTING: "bg-cyan-950 text-cyan-300 border-cyan-500/50 animate-pulse",
  COMMITTED: "bg-emerald-950 text-emerald-300 border-emerald-500/50",
  ABORTING: "bg-amber-950 text-amber-300 border-amber-500/60 animate-pulse",
  AWAITING_COMPENSATION_APPROVAL: "bg-amber-900 text-amber-100 border-amber-400 animate-pulse font-bold",
  COMPENSATING: "bg-indigo-950 text-indigo-300 border-indigo-500/60 animate-pulse",
  COMPENSATED: "bg-emerald-950 text-emerald-300 border-emerald-500/60 font-bold",
  MANUAL_ATTENTION_REQUIRED: "bg-rose-950 text-rose-300 border-rose-500/80 font-bold animate-pulse",
  FAILED: "bg-rose-950 text-rose-300 border-rose-500/60 font-bold",
};

export default function CompensationDemo({
  transaction,
  isRunning,
  isConnected,
  eventLog,
  authoritativeState,
  onRunDemo,
  onApproveCompensation,
  onRejectCompensation,
  onResetDemo,
  onClearLog,
}: CompensationDemoProps) {
  const dbNode = transaction.nodes.find((n) => n.id === "database:create");

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-linear-to-b from-amber-950/20 via-slate-900/60 to-slate-900/60 p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              MCPx Saga Compensation Demo
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed Failure (<code className="text-amber-300">reject-before-commit</code>), Human Approval & WebMCP Rollback
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${txStateColors[transaction.state]
              }`}
          >
            TX: {transaction.state.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Visual DAG */}
      <TransactionDAG transaction={transaction} />

      {/* Human Approval Card if waiting */}
      {transaction.state === "AWAITING_COMPENSATION_APPROVAL" && (
        <ApprovalCard
          resourceId={dbNode?.resourceId}
          onApprove={onApproveCompensation}
          onReject={onRejectCompensation}
          disabled={isRunning}
        />
      )}

      {/* Controls & Event Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Actions & Authoritative State */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onRunDemo}
                disabled={isRunning || !isConnected}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Executing Multi-Step Saga...
                  </span>
                ) : (
                  <span>[ RUN COMPENSATION DEMO ]</span>
                )}
              </button>

              <button
                onClick={onResetDemo}
                disabled={isRunning}
                className="py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Authoritative Resource Inspection */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300 font-sans">
                Authoritative Resource Inspection
              </span>
              <span className="text-[10px] text-slate-400">Live Services</span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Database Resource:</span>
                <span
                  className={
                    authoritativeState.database
                      ? "text-emerald-400 font-bold"
                      : "text-slate-400"
                  }
                >
                  {authoritativeState.database
                    ? `PRESENT (${authoritativeState.database.id.slice(0, 8)}...)`
                    : "ABSENT / COMPENSATED"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Routing Resource:</span>
                <span className="text-slate-400">ABSENT (Clean rejection)</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-cyan-300 font-semibold truncate max-w-50">
                  {transaction.id}
                </span>
              </div>

              {transaction.lastError && (
                <div className="pt-1 text-rose-300 text-[11px]">
                  <span className="font-bold">Last Error:</span> {transaction.lastError}
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
