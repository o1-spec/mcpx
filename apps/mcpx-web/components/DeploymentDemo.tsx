"use client";

import { useState } from "react";
import type {
  TransactionModel,
  TransactionEvent,
} from "@/types/reliability";
import type { FourServiceAuthoritativeState } from "@/hooks/useDeploymentDemo";
import DeploymentDAG from "@/components/deployment/DeploymentDAG";
import ApprovalCard from "@/components/compensation/ApprovalCard";
import EventTimeline from "@/components/reliability/EventTimeline";
import { origins } from "@/lib/config/origins";

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

export default function DeploymentDemo({
  transaction,
  isRunning,
  isHydrating,
  isConnected,
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
  const [selectedScenario, setSelectedScenario] = useState<"challenge" | "happy">("challenge");
  const [copied, setCopied] = useState(false);

  const isCommitted = transaction.state === "COMMITTED";
  const isCompensated = transaction.state === "COMPENSATED";
  const isAwaitingApproval = transaction.state === "AWAITING_COMPENSATION_APPROVAL";

  const dbNode = transaction.nodes.find((n) => n.id === "database:create");
  const backendNode = transaction.nodes.find((n) => n.id === "backend:deploy");
  const routingNode = transaction.nodes.find((n) => n.id === "routing:create");
  const frontendNode = transaction.nodes.find((n) => n.id === "frontend:deploy");

  const copyTxId = () => {
    navigator.clipboard.writeText(transaction.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const backendHealthUrl =
    authoritativeState.backend?.healthUrl ||
    (authoritativeState.backend?.id
      ? `${origins.compute}/runtime/${authoritativeState.backend.id}/health`
      : undefined);

  const routingGatewayUrl =
    authoritativeState.routing?.routeUrl ||
    (authoritativeState.routing ? `${origins.routing}/r/${authoritativeState.routing.projectName}` : undefined);

  const frontendPreviewUrl =
    authoritativeState.frontend?.previewUrl ||
    (authoritativeState.frontend ? `${origins.frontend}/preview/${authoritativeState.frontend.projectName}` : undefined);

  // Authoritative Resource Display Logic
  const getResourceStatus = (
    service: "database" | "backend" | "routing" | "frontend"
  ): { label: string; style: string; sublink?: { url: string; text: string } } => {
    if (isCompensated) {
      if (service === "frontend") {
        return { label: "Never created ✓", style: "text-[#65696B] font-mono text-[11px]" };
      }
      return { label: "Removed ✓", style: "text-[#65696B] font-mono text-[11px]" };
    }

    if (service === "database") {
      if (dbNode?.state === "SUCCEEDED" && authoritativeState.database) {
        return {
          label: "Present",
          style: "text-[#A5F36B] font-mono text-[11px]",
        };
      }
      if (dbNode?.state === "COMPENSATED") {
        return { label: "Removed ✓", style: "text-[#65696B] font-mono text-[11px]" };
      }
      return { label: "Not created", style: "text-[#65696B] font-mono text-[11px]" };
    }

    if (service === "backend") {
      if (backendNode?.state === "SUCCEEDED" && authoritativeState.backend) {
        return {
          label: "Healthy · 200",
          style: "text-[#A5F36B] font-mono text-[11px]",
          sublink: backendHealthUrl ? { url: backendHealthUrl, text: "Health ↗" } : undefined,
        };
      }
      if (backendNode?.state === "COMPENSATED") {
        return { label: "Removed ✓", style: "text-[#65696B] font-mono text-[11px]" };
      }
      return { label: "Not created", style: "text-[#65696B] font-mono text-[11px]" };
    }

    if (service === "routing") {
      if (
        (routingNode?.state === "SUCCEEDED" || routingNode?.state === "RECOVERED") &&
        authoritativeState.routing
      ) {
        return {
          label: routingNode.state === "RECOVERED" ? "Recovered · 200" : "Present · 200",
          style: "text-[#A5F36B] font-mono text-[11px]",
          sublink: routingGatewayUrl ? { url: routingGatewayUrl, text: "Gateway ↗" } : undefined,
        };
      }
      if (routingNode?.state === "IN_DOUBT") {
        return { label: "Unknown (lost ACK)", style: "text-amber-400 font-mono text-[11px]" };
      }
      if (routingNode?.state === "RECONCILING") {
        return { label: "Inspecting remote store…", style: "text-cyan-400 font-mono text-[11px]" };
      }
      if (routingNode?.state === "COMPENSATED") {
        return { label: "Removed ✓", style: "text-[#65696B] font-mono text-[11px]" };
      }
      return { label: "Not created", style: "text-[#65696B] font-mono text-[11px]" };
    }

    if (service === "frontend") {
      if (frontendNode?.state === "SUCCEEDED" && authoritativeState.frontend) {
        return {
          label: "Live · 200",
          style: "text-[#A5F36B] font-mono text-[11px]",
          sublink: frontendPreviewUrl ? { url: frontendPreviewUrl, text: "Preview ↗" } : undefined,
        };
      }
      if (frontendNode?.state === "FAILED") {
        return { label: "Failed before commit", style: "text-rose-400 font-mono text-[11px]" };
      }
      return { label: "Not created", style: "text-[#65696B] font-mono text-[11px]" };
    }

    return { label: "Unknown", style: "text-[#65696B] font-mono text-[11px]" };
  };

  const handleRun = () => {
    onRunDeployment(selectedScenario === "challenge");
  };

  const recentEvents = [...eventLog].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. CONTROL PLANE HEADER WITH SCENARIO TOGGLE */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] sm:text-[19px] font-bold tracking-tight text-[#F2F3F1] font-display">
              Reference deployment
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#969B9E]">
              4 services
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#A5F36B]/10 border border-[#A5F36B]/20 text-[#A5F36B] hidden sm:inline-block">
              PostgreSQL durable
            </span>
          </div>
          <p className="text-[12.5px] text-[#969B9E] max-w-xl">
            Application deployment across four independent WebMCP services with authoritative recovery.
          </p>
        </div>

        {/* Compact Scenario Selector & Run Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border border-white/[0.08] bg-[#0C0E0F] p-0.5 font-mono text-[11.5px]">
            <button
              onClick={() => setSelectedScenario("challenge")}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                selectedScenario === "challenge"
                  ? "bg-white/[0.08] text-[#F2F3F1] font-semibold"
                  : "text-[#969B9E] hover:text-[#F2F3F1]"
              }`}
            >
              Challenge
            </button>
            <button
              onClick={() => setSelectedScenario("happy")}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                selectedScenario === "happy"
                  ? "bg-white/[0.08] text-[#F2F3F1] font-semibold"
                  : "text-[#969B9E] hover:text-[#F2F3F1]"
              }`}
            >
              Happy path
            </button>
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning || isHydrating}
            className="px-4 py-2 rounded-md font-mono text-[12px] font-medium bg-[#F2F3F1] text-[#080A0B] hover:bg-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {isRunning ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#080A0B] animate-ping"></span>
                <span>Executing…</span>
              </>
            ) : selectedScenario === "challenge" ? (
              <span>Run challenge</span>
            ) : (
              <span>Run happy path</span>
            )}
          </button>

          <button
            onClick={onInspectAll}
            disabled={isRunning}
            className="px-3 py-2 rounded-md font-mono text-[12px] text-[#969B9E] hover:text-[#F2F3F1] hover:bg-white/[0.04] border border-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
            title="Inspect remote state"
          >
            Inspect
          </button>

          <button
            onClick={onReset}
            disabled={isRunning}
            className="px-3 py-2 rounded-md font-mono text-[12px] text-[#969B9E] hover:text-[#F2F3F1] hover:bg-white/[0.04] border border-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
            title="Reset transaction"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Scenario Explanation subtext */}
      <div className="text-[11.5px] font-mono text-[#65696B]">
        {selectedScenario === "challenge" ? (
          <span>
            <strong className="text-[#969B9E]">Scenario: </strong>
            Lost acknowledgement on Routing (<code className="text-amber-400">IN_DOUBT</code>) → authoritative reconciliation (<code className="text-[#A5F36B]">RECOVERED</code>) → confirmed Frontend failure → human-approved reverse Saga rollback.
          </span>
        ) : (
          <span>
            <strong className="text-[#969B9E]">Scenario: </strong>
            Happy path execution across all 4 services (<code className="text-[#A5F36B]">COMMITTED</code>).
          </span>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. CORE TWO-COLUMN CONTROL PLANE (70% MAIN / 30% RAIL) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LIVE TRANSACTION DAG (~68%) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border border-white/[0.08] bg-[#0C0E0F] p-6 relative">
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-white/[0.06] font-mono text-[11px] text-[#65696B]">
              <span>LIVE TRANSACTION TOPOLOGY</span>
              <span>STATE: {transaction.state}</span>
            </div>

            {/* Direct DAG Canvas (No giant outer card) */}
            <DeploymentDAG transaction={transaction} />

            {/* Inline Human Approval Safety Gate */}
            {isAwaitingApproval && (
              <div className="mt-6 pt-6 border-t border-amber-500/30">
                <ApprovalCard
                  onApprove={onApproveCompensation}
                  onReject={onRejectCompensation}
                  disabled={isRunning}
                />
              </div>
            )}

            {/* Completed Outcome Banner */}
            {isCompensated && (
              <div className="mt-6 p-4 border border-white/[0.08] bg-[#080A0B] font-mono text-[11.5px] space-y-1.5">
                <div className="flex items-center justify-between text-[#F2F3F1] font-semibold">
                  <span className="text-[#A5F36B]">✓ Transaction compensated</span>
                  <span>3 resources removed and verified</span>
                </div>
                <div className="text-[#969B9E] text-[11px]">
                  Frontend was never created. Reverse rollback completed in verified order (Routing → Backend → Database).
                </div>
              </div>
            )}

            {/* Happy Path Outcome Banner */}
            {isCommitted && (
              <div className="mt-6 p-4 border border-[#A5F36B]/30 bg-[#A5F36B]/5 font-mono text-[11.5px] space-y-2">
                <div className="flex items-center justify-between text-[#F2F3F1] font-semibold">
                  <span className="text-[#A5F36B]">✓ Deployment committed</span>
                  <span>4 resources active</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {frontendPreviewUrl && (
                    <a
                      href={frontendPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded bg-[#A5F36B] text-[#080A0B] font-semibold text-[11px] hover:bg-white transition-colors"
                    >
                      Open application ↗
                    </a>
                  )}
                  {routingGatewayUrl && (
                    <a
                      href={routingGatewayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded bg-white/[0.06] text-[#F2F3F1] text-[11px] hover:bg-white/[0.1] transition-colors"
                    >
                      Gateway route ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TRANSACTION RAIL (~32%) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Section 1: Transaction Summary */}
          <div className="border border-white/[0.08] bg-[#0C0E0F] p-4 space-y-3 font-mono text-[11.5px]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-[10px] text-[#65696B] uppercase">Transaction</span>
              <span
                className={`px-2 py-0.5 text-[10px] border ${
                  isCommitted || isCompensated
                    ? "bg-emerald-950/60 text-[#A5F36B] border-[#A5F36B]/30"
                    : isAwaitingApproval
                    ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                    : "bg-white/[0.04] text-[#F2F3F1] border-white/[0.08]"
                }`}
              >
                {transaction.state}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-[#969B9E]">
                <span>ID</span>
                <button
                  onClick={copyTxId}
                  className="text-[#F2F3F1] hover:text-[#A5F36B] flex items-center gap-1 cursor-pointer"
                  title="Click to copy"
                >
                  <span className="truncate max-w-[130px]">{transaction.id}</span>
                  <span className="text-[10px]">{copied ? "✓" : "📋"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[#969B9E]">
                <span>Durability</span>
                <span className="text-[#A5F36B]">PostgreSQL connected</span>
              </div>

              <div className="flex items-center justify-between text-[#969B9E]">
                <span>Workflow</span>
                <span className="text-[#F2F3F1]">Reference deployment</span>
              </div>
            </div>
          </div>

          {/* Section 2: Authoritative State List */}
          <div className="border border-white/[0.08] bg-[#0C0E0F] p-4 space-y-3 font-mono text-[11.5px]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-[10px] text-[#65696B] uppercase">Authoritative State</span>
              <span className="text-[10px] text-[#65696B]">REAL-TIME</span>
            </div>

            <div className="divide-y divide-white/[0.04] space-y-2 pt-1">
              {/* Database */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[#F2F3F1] text-[12px]">Database</div>
                  <div className="text-[10px] text-[#65696B]">PostgreSQL schema</div>
                </div>
                <div>{getResourceStatus("database").label}</div>
              </div>

              {/* Backend */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[#F2F3F1] text-[12px]">Backend</div>
                  <div className="text-[10px] text-[#65696B]">Compute runtime</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={getResourceStatus("backend").style}>
                    {getResourceStatus("backend").label}
                  </span>
                  {getResourceStatus("backend").sublink && (
                    <a
                      href={getResourceStatus("backend").sublink?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#A5F36B] hover:underline text-[10px]"
                    >
                      {getResourceStatus("backend").sublink?.text}
                    </a>
                  )}
                </div>
              </div>

              {/* Routing */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[#F2F3F1] text-[12px]">Routing</div>
                  <div className="text-[10px] text-[#65696B]">Gateway proxy route</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={getResourceStatus("routing").style}>
                    {getResourceStatus("routing").label}
                  </span>
                  {getResourceStatus("routing").sublink && (
                    <a
                      href={getResourceStatus("routing").sublink?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#A5F36B] hover:underline text-[10px]"
                    >
                      {getResourceStatus("routing").sublink?.text}
                    </a>
                  )}
                </div>
              </div>

              {/* Frontend */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[#F2F3F1] text-[12px]">Frontend</div>
                  <div className="text-[10px] text-[#65696B]">Preview deployment</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={getResourceStatus("frontend").style}>
                    {getResourceStatus("frontend").label}
                  </span>
                  {getResourceStatus("frontend").sublink && (
                    <a
                      href={getResourceStatus("frontend").sublink?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#A5F36B] hover:underline text-[10px]"
                    >
                      {getResourceStatus("frontend").sublink?.text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Recent Activity Log */}
          <div className="border border-white/[0.08] bg-[#0C0E0F] p-4 space-y-3 font-mono text-[11.5px]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-[10px] text-[#65696B] uppercase">Recent Activity</span>
              <span className="text-[10px] text-[#65696B]">LATEST 5</span>
            </div>

            {recentEvents.length === 0 ? (
              <div className="py-4 text-center text-[#65696B] text-[11px]">
                No events recorded yet. Run a scenario above.
              </div>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((ev, idx) => (
                  <div key={idx} className="flex items-start justify-between text-[10.5px] leading-tight">
                    <div className="space-y-0.5">
                      <span className="text-[#F2F3F1] block">{ev.type}</span>
                      <span className="text-[#65696B]">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-[#969B9E] text-[10px]">#{eventLog.length - idx}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. FULL EVENT TIMELINE (LOG VIEW) */}
      {/* ============================================================ */}
      <div className="pt-2">
        <EventTimeline eventLog={eventLog} onClearLog={onClearLog} />
      </div>
    </div>
  );
}
