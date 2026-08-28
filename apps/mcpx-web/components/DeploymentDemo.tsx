"use client";

import { useState } from "react";
import type {
  TransactionModel,
  TransactionEvent,
  TransactionState,
} from "@/types/reliability";
import type { FourServiceAuthoritativeState } from "@/hooks/useDeploymentDemo";
import DeploymentDAG from "@/components/deployment/DeploymentDAG";
import ApprovalCard from "@/components/compensation/ApprovalCard";
import EventLogList from "@/components/reliability/EventLogList";

interface DeploymentDemoProps {
  transaction: TransactionModel;
  isRunning: boolean;
  isHydrating: boolean;
  isConnected: boolean;
  pauseBeforeReconcile: boolean;
  onSetPauseBeforeReconcile: (val: boolean) => void;
  eventLog: TransactionEvent[];
  authoritativeState: FourServiceAuthoritativeState;
  onRunDeployment: (failureScenario?: boolean) => void;
  onApproveCompensation: () => void;
  onRejectCompensation: () => void;
  onInspectAll: () => void;
  onRehydrate: (txId: string) => void;
  onReset: () => void;
  onClearLog: () => void;
}

const txStateColors: Record<TransactionState, string> = {
  CREATED: "bg-slate-800 text-slate-400 border-slate-700",
  EXECUTING: "bg-cyan-950 text-cyan-300 border-cyan-500/50 animate-pulse",
  COMMITTED: "bg-emerald-950 text-emerald-300 border-emerald-500/50 font-bold",
  ABORTING: "bg-amber-950 text-amber-300 border-amber-500/60 animate-pulse",
  AWAITING_COMPENSATION_APPROVAL: "bg-amber-900 text-amber-100 border-amber-400 font-bold animate-pulse",
  COMPENSATING: "bg-indigo-950 text-indigo-300 border-indigo-500/60 animate-pulse",
  COMPENSATED: "bg-emerald-950 text-emerald-300 border-emerald-500/60 font-bold",
  MANUAL_ATTENTION_REQUIRED: "bg-rose-950 text-rose-300 border-rose-500/80 font-bold animate-pulse",
  FAILED: "bg-rose-950 text-rose-300 border-rose-500/60 font-bold",
};

export default function DeploymentDemo({
  transaction,
  isRunning,
  isHydrating,
  isConnected,
  pauseBeforeReconcile,
  onSetPauseBeforeReconcile,
  eventLog,
  authoritativeState,
  onRunDeployment,
  onApproveCompensation,
  onRejectCompensation,
  onInspectAll,
  onRehydrate,
  onReset,
  onClearLog,
}: DeploymentDemoProps) {
  const [copied, setCopied] = useState(false);
  const isCommitted = transaction.state === "COMMITTED";
  const isCompensated = transaction.state === "COMPENSATED";

  const completedCount = transaction.nodes.filter(
    (n) => n.state === "SUCCEEDED" || n.state === "RECOVERED"
  ).length;

  const copyTxId = () => {
    navigator.clipboard.writeText(transaction.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const backendHealthUrl =
    authoritativeState.backend?.healthUrl ||
    (authoritativeState.backend?.id
      ? `http://localhost:3003/runtime/${authoritativeState.backend.id}/health`
      : undefined);

  const routingGatewayUrl =
    authoritativeState.routing?.routeUrl ||
    (authoritativeState.routing ? `http://localhost:3001/r/${authoritativeState.routing.projectName}` : undefined);

  const frontendPreviewUrl =
    authoritativeState.frontend?.previewUrl ||
    (authoritativeState.frontend ? `http://localhost:3004/preview/${authoritativeState.frontend.projectName}` : undefined);

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 via-slate-900/60 to-slate-900/60 p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Durable Coordinator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              MCPx Durable Coordinator & Real Postgres Resource Plane
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real Postgres Schemas (<code className="text-emerald-300">:5435</code>) • WebMCP Microservices (<code className="text-cyan-300">:3001–:3004</code>) • Durable State Store
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

      {/* Durable Transaction ID Toolbar */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-slate-500 uppercase text-[10px] whitespace-nowrap">Active TX:</span>
          <code className="text-indigo-300 font-bold truncate">{transaction.id}</code>
          <button
            onClick={copyTxId}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase cursor-pointer transition-colors"
          >
            {copied ? "✓ Copied" : "Copy ID"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-sans">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Postgres Durable
          </span>
          <button
            onClick={() => onRehydrate(transaction.id)}
            disabled={isHydrating || isRunning}
            className="px-3 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
          >
            {isHydrating ? "Hydrating..." : "[ Reload from Durable DB ]"}
          </button>
        </div>
      </div>

      {/* Visual 4-Node DAG */}
      <DeploymentDAG transaction={transaction} />

      {/* Prominent Open Application Banner when COMMITTED */}
      {isCommitted && frontendPreviewUrl && (
        <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-base font-bold text-white">
                Application Successfully Deployed & Bound
              </h3>
            </div>
            <p className="text-xs text-emerald-300">
              All 4 microservices provisioned, real Postgres schema created, and bound through WebMCP.
            </p>
          </div>

          <a
            href={frontendPreviewUrl}
            target="_blank"
            rel="noreferrer"
            className="py-3 px-6 rounded-xl font-bold text-xs tracking-wider uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/80 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span>[ OPEN APPLICATION ]</span>
            <span className="text-base">↗</span>
          </a>
        </div>
      )}

      {/* Approval Card when waiting for compensation approval */}
      {transaction.state === "AWAITING_COMPENSATION_APPROVAL" && (
        <ApprovalCard
          resourceId={`${completedCount} resources (Routing → Backend → Database)`}
          onApprove={onApproveCompensation}
          onReject={onRejectCompensation}
          disabled={isRunning}
        />
      )}

      {/* Grid: Actions & Authoritative Inspector on Left, Event Log on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Action Buttons */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
              Run Scenarios
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => onRunDeployment(true)}
                disabled={isRunning || !isConnected}
                className="py-3 px-3 rounded-xl font-bold text-xs tracking-wider uppercase bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Executing...
                  </span>
                ) : (
                  <span>[ RUN CHALLENGE SCENARIO ]</span>
                )}
              </button>

              <button
                onClick={() => onRunDeployment(false)}
                disabled={isRunning || !isConnected}
                className="py-3 px-3 rounded-xl font-bold text-xs tracking-wider uppercase bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>[ RUN HAPPY PATH ]</span>
              </button>
            </div>

            {/* Development Crash/Refresh Testing Option */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="flex items-center gap-2 text-xs text-amber-300 font-mono cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pauseBeforeReconcile}
                  onChange={(e) => onSetPauseBeforeReconcile(e.target.checked)}
                  className="rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                />
                <span>Pause after IN_DOUBT (Test Browser Refresh Recovery)</span>
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={onInspectAll}
                disabled={isRunning}
                className="flex-1 py-2 px-3 rounded-lg font-semibold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Inspect All (WebMCP)
              </button>

              <button
                onClick={onReset}
                disabled={isRunning}
                className="py-2 px-4 rounded-lg font-semibold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Authoritative Resource Inspector & Real Postgres Schema Panel */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300 font-sans">
                Authoritative Resource & Postgres Schema Inspector
              </span>
              <span className="text-[10px] text-emerald-400">Postgres 17</span>
            </div>

            <div className="space-y-2.5 text-slate-300">
              {/* Real Database Postgres Schema */}
              <div className="space-y-1 py-1 border-b border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Database Resource:</span>
                  <span className={authoritativeState.database ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                    {authoritativeState.database ? `PRESENT (${authoritativeState.database.id.slice(0, 8)}...)` : "ABSENT / COMPENSATED"}
                  </span>
                </div>
                {authoritativeState.database?.schemaName && (
                  <div className="flex items-center justify-between text-[11px] pl-2">
                    <span className="text-slate-500">Postgres Schema:</span>
                    <span className="text-emerald-300 font-bold">
                      {authoritativeState.database.schemaName}
                    </span>
                  </div>
                )}
              </div>

              {/* Backend Compute */}
              <div className="space-y-1 py-1 border-b border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Backend Compute:</span>
                  <span className={authoritativeState.backend ? "text-indigo-400 font-semibold" : "text-slate-500"}>
                    {authoritativeState.backend ? `PRESENT (${authoritativeState.backend.id.slice(0, 8)}...)` : "ABSENT / COMPENSATED"}
                  </span>
                </div>
                {backendHealthUrl && (
                  <div className="flex items-center justify-between text-[11px] pl-2">
                    <span className="text-slate-500">Health Endpoint:</span>
                    <a
                      href={backendHealthUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-300 hover:underline flex items-center gap-1"
                    >
                      <span>{backendHealthUrl.replace("http://localhost:3003", "")}</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Routing Gateway */}
              <div className="space-y-1 py-1 border-b border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Routing Gateway:</span>
                  <span className={authoritativeState.routing ? "text-cyan-400 font-semibold" : "text-slate-500"}>
                    {authoritativeState.routing ? `PRESENT (${authoritativeState.routing.id.slice(0, 8)}...)` : "ABSENT / COMPENSATED"}
                  </span>
                </div>
                {routingGatewayUrl && (
                  <div className="flex items-center justify-between text-[11px] pl-2">
                    <span className="text-slate-500">Gateway Route:</span>
                    <a
                      href={routingGatewayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      <span>{routingGatewayUrl.replace("http://localhost:3001", "")}</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Frontend Preview */}
              <div className="space-y-1 py-1 border-b border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Frontend Preview:</span>
                  <span className={authoritativeState.frontend ? "text-violet-400 font-semibold" : "text-slate-500"}>
                    {authoritativeState.frontend ? `PRESENT (${authoritativeState.frontend.id.slice(0, 8)}...)` : "ABSENT (Clean Rejection / Compensated)"}
                  </span>
                </div>
                {frontendPreviewUrl && (
                  <div className="flex items-center justify-between text-[11px] pl-2">
                    <span className="text-slate-500">Preview Page:</span>
                    <a
                      href={frontendPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-300 hover:underline flex items-center gap-1"
                    >
                      <span>{frontendPreviewUrl.replace("http://localhost:3004", "")}</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>

              {isCommitted && (
                <div className="pt-2 text-emerald-400 text-[11px] font-sans font-medium flex items-center gap-1.5">
                  <span>✓</span> Committed & Persisted in Postgres. Schema & endpoints verified reachable.
                </div>
              )}

              {isCompensated && (
                <div className="pt-2 text-emerald-400 text-[11px] font-sans font-medium flex items-center gap-1.5">
                  <span>✓</span> Compensated & Persisted. Real Postgres schema dropped (`CASCADE`) and verified absent.
                </div>
              )}

              {transaction.state === "MANUAL_ATTENTION_REQUIRED" && (
                <div className="pt-2 text-rose-400 text-[11px] font-sans font-bold flex items-center gap-1.5">
                  <span>✕</span> {transaction.lastError || "Manual attention required: resource retained in store after compensation."}
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
