"use client";

import type {
  TransactionNode,
  TransactionEvent,
  AuthoritativeState,
} from "@/types/reliability";
import StatePipeline, { stateColors } from "@/components/reliability/StatePipeline";
import AuthoritativeInspectionCard from "@/components/reliability/AuthoritativeInspectionCard";
import EventLogList from "@/components/reliability/EventLogList";

interface ReliabilityDemoProps {
  reliabilityOpKey: string;
  onOpKeyChange: (newKey: string) => void;
  isRunning: boolean;
  isConnected: boolean;
  transactionNode: TransactionNode;
  eventLog: TransactionEvent[];
  authoritativeState: AuthoritativeState;
  onRunDemo: () => void;
  onResetDemo: () => void;
  onClearLog: () => void;
}

export default function ReliabilityDemo({
  reliabilityOpKey,
  onOpKeyChange,
  isRunning,
  isConnected,
  transactionNode,
  eventLog,
  authoritativeState,
  onRunDemo,
  onResetDemo,
  onClearLog,
}: ReliabilityDemoProps) {
  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 via-slate-900/60 to-slate-900/60 p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              MCPx Reliability Demo
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic Failure Injection (<code className="text-indigo-300">drop-ack-after-commit</code>) & Authoritative Reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              stateColors[transactionNode.state].badge
            }`}
          >
            State: {transactionNode.state}
          </span>
        </div>
      </div>

      {/* State Pipeline */}
      <StatePipeline currentState={transactionNode.state} />

      {/* Execution Controls & Event Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Inspection Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-3 p-5 rounded-xl border border-slate-800 bg-slate-950/50">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Operation Key
              </label>
              <input
                type="text"
                value={reliabilityOpKey}
                onChange={(e) => onOpKeyChange(e.target.value)}
                placeholder="tx:demo-002:routing:create"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onRunDemo}
                disabled={isRunning || !isConnected}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Executing & Reconciling...
                  </span>
                ) : (
                  <span>[ RUN RELIABILITY DEMO ]</span>
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

          <AuthoritativeInspectionCard
            authoritativeState={authoritativeState}
            transactionNode={transactionNode}
          />
        </div>

        {/* Right Column: Event Log */}
        <EventLogList eventLog={eventLog} onClearLog={onClearLog} />
      </div>
    </section>
  );
}
