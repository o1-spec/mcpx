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
import PageHeader from "@/components/ui/PageHeader";
import StatusPill from "@/components/ui/StatusPill";
import Panel from "@/components/ui/Panel";
import DiagnosticsDrawer from "@/components/ui/DiagnosticsDrawer";
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
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

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
  ): { label: string; status: "READY" | "IN_DOUBT" | "EXECUTING" | "FAILED" | "COMPENSATED" | "DRAFT"; sublink?: { url: string; text: string } } => {
    if (isCompensated) {
      if (service === "frontend") {
        return { label: "Never created", status: "COMPENSATED" };
      }
      return { label: "Removed ✓", status: "COMPENSATED" };
    }

    if (service === "database") {
      if (dbNode?.state === "SUCCEEDED" && authoritativeState.database) {
        return { label: "Present · Active", status: "READY" };
      }
      if (dbNode?.state === "COMPENSATED") {
        return { label: "Removed ✓", status: "COMPENSATED" };
      }
      return { label: "Not created", status: "DRAFT" };
    }

    if (service === "backend") {
      if (backendNode?.state === "SUCCEEDED" && authoritativeState.backend) {
        return {
          label: "Healthy · 200",
          status: "READY",
          sublink: backendHealthUrl ? { url: backendHealthUrl, text: "Health ↗" } : undefined,
        };
      }
      if (backendNode?.state === "COMPENSATED") {
        return { label: "Removed ✓", status: "COMPENSATED" };
      }
      return { label: "Not created", status: "DRAFT" };
    }

    if (service === "routing") {
      if (
        (routingNode?.state === "SUCCEEDED" || routingNode?.state === "RECOVERED") &&
        authoritativeState.routing
      ) {
        return {
          label: routingNode.state === "RECOVERED" ? "Recovered · 200" : "Present · 200",
          status: "READY",
          sublink: routingGatewayUrl ? { url: routingGatewayUrl, text: "Gateway ↗" } : undefined,
        };
      }
      if (routingNode?.state === "IN_DOUBT") {
        return { label: "Lost ACK (In Doubt)", status: "IN_DOUBT" };
      }
      if (routingNode?.state === "RECONCILING") {
        return { label: "Inspecting remote store…", status: "EXECUTING" };
      }
      if (routingNode?.state === "COMPENSATED") {
        return { label: "Removed ✓", status: "COMPENSATED" };
      }
      return { label: "Not created", status: "DRAFT" };
    }

    if (service === "frontend") {
      if (frontendNode?.state === "SUCCEEDED" && authoritativeState.frontend) {
        return {
          label: "Live · 200",
          status: "READY",
          sublink: frontendPreviewUrl ? { url: frontendPreviewUrl, text: "Preview ↗" } : undefined,
        };
      }
      if (frontendNode?.state === "FAILED") {
        return { label: "Failed before commit", status: "FAILED" };
      }
      return { label: "Not created", status: "DRAFT" };
    }

    return { label: "Unknown", status: "DRAFT" };
  };

  const handleRun = () => {
    onRunDeployment(selectedScenario === "challenge");
  };

  const recentEvents = [...eventLog].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Controls */}
      <PageHeader
        title="Runtime Control Plane"
        description="Durable multi-service WebMCP coordinator with state persistence, authoritative reconciliation, and Saga rollback."
        badge={
          <div className="flex items-center gap-2">
            <StatusPill status="ACTIVE" size="sm" />
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#A0A0A4]">
              4 microservices
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scenario Toggle */}
            <div className="flex items-center rounded border border-white/[0.08] bg-[#0B0C0E] p-0.5 font-mono text-[11.5px]">
              <button
                type="button"
                onClick={() => setSelectedScenario("challenge")}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  selectedScenario === "challenge"
                    ? "bg-white/[0.08] text-[#F5F5F3] font-semibold"
                    : "text-[#A0A0A4] hover:text-[#F5F5F3]"
                }`}
              >
                Challenge Mode
              </button>
              <button
                type="button"
                onClick={() => setSelectedScenario("happy")}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  selectedScenario === "happy"
                    ? "bg-white/[0.08] text-[#F5F5F3] font-semibold"
                    : "text-[#A0A0A4] hover:text-[#F5F5F3]"
                }`}
              >
                Happy Path
              </button>
            </div>

            {/* Run Action */}
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning || isHydrating}
              className="px-4 py-2 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[12.5px] font-sans transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isRunning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#070708] animate-ping" />
                  <span>Executing Pipeline…</span>
                </>
              ) : selectedScenario === "challenge" ? (
                <span>Run Challenge Flow →</span>
              ) : (
                <span>Run Happy Path →</span>
              )}
            </button>

            {/* Diagnostics Drawer Trigger */}
            <button
              type="button"
              onClick={() => setDiagnosticsOpen(true)}
              className="px-3 py-2 rounded font-mono text-[12px] text-[#A0A0A4] hover:text-[#F5F5F3] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors cursor-pointer"
            >
              Diagnostics ↗
            </button>

            <button
              type="button"
              onClick={onReset}
              disabled={isRunning}
              className="px-3 py-2 rounded font-mono text-[12px] text-[#66686D] hover:text-[#F5F5F3] hover:bg-white/[0.04] transition-colors cursor-pointer disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        }
      />

      {/* Scenario Explanatory Sub-bar */}
      <div className="p-3 bg-[#0B0C0E] border border-white/[0.06] rounded text-[12px] font-mono text-[#A0A0A4] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#66686D]">ACTIVE SCENARIO:</span>
          {selectedScenario === "challenge" ? (
            <span>
              Lost ACK on Routing (<span className="text-amber-400">IN_DOUBT</span>) → authoritative reconciliation (<span className="text-[#A5F36B]">RECOVERED</span>) → confirmed Frontend failure → human-approved reverse rollback.
            </span>
          ) : (
            <span>
              Direct 4-node pipeline execution across all services (<span className="text-[#A5F36B]">COMMITTED</span>).
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#66686D] shrink-0">POSTGRESQL DURABILITY</span>
      </div>

      {/* 2. Main Two-Column Control Plane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LIVE TRANSACTION TOPOLOGY (~68%) */}
        <div className="lg:col-span-8 space-y-6">
          <Panel
            title="TRANSACTION TOPOLOGY"
            badge={<StatusPill status={transaction.state} size="sm" />}
            actions={
              <button
                type="button"
                onClick={onInspectAll}
                disabled={isRunning}
                className="text-[11px] font-mono text-[#A0A0A4] hover:text-[#A5F36B] transition-colors cursor-pointer disabled:opacity-50"
              >
                Inspect All Nodes ↻
              </button>
            }
          >
            <div className="py-2">
              <DeploymentDAG transaction={transaction} />
            </div>

            {/* Inline Human Safety Gate */}
            {isAwaitingApproval && (
              <div className="mt-6 pt-6 border-t border-amber-500/30">
                <ApprovalCard
                  onApprove={onApproveCompensation}
                  onReject={onRejectCompensation}
                  disabled={isRunning}
                />
              </div>
            )}

            {/* Outcome Banner Compensated */}
            {isCompensated && (
              <div className="mt-6 p-4 border border-white/[0.08] bg-[#070708] font-mono text-[11.5px] space-y-1.5 rounded">
                <div className="flex items-center justify-between text-[#F5F5F3] font-semibold">
                  <span className="text-[#A5F36B]">✓ Transaction compensated</span>
                  <span>3 resources removed and verified</span>
                </div>
                <div className="text-[#A0A0A4] text-[11px]">
                  Frontend was never created. Reverse rollback completed in verified order (Routing → Backend → Database).
                </div>
              </div>
            )}

            {/* Outcome Banner Committed */}
            {isCommitted && (
              <div className="mt-6 p-4 border border-[#A5F36B]/30 bg-[#A5F36B]/5 font-mono text-[11.5px] space-y-2 rounded">
                <div className="flex items-center justify-between text-[#F5F5F3] font-semibold">
                  <span className="text-[#A5F36B]">✓ Deployment committed</span>
                  <span>4 resources active</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {frontendPreviewUrl && (
                    <a
                      href={frontendPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded bg-[#A5F36B] text-[#070708] font-semibold text-[11px] hover:bg-white transition-colors"
                    >
                      Open application ↗
                    </a>
                  )}
                  {routingGatewayUrl && (
                    <a
                      href={routingGatewayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded bg-white/[0.06] text-[#F5F5F3] text-[11px] hover:bg-white/[0.1] transition-colors"
                    >
                      Gateway route ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </Panel>

          {/* Full Event Timeline */}
          <EventTimeline eventLog={eventLog} onClearLog={onClearLog} />
        </div>

        {/* RIGHT COLUMN: TRANSACTION AUDIT RAIL (~32%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section 1: Transaction Metadata */}
          <Panel title="TRANSACTION METADATA">
            <div className="space-y-3 font-mono text-[11.5px]">
              <div className="flex items-center justify-between text-[#A0A0A4]">
                <span>Status</span>
                <StatusPill status={transaction.state} size="sm" />
              </div>

              <div className="flex items-center justify-between text-[#A0A0A4]">
                <span>Transaction ID</span>
                <button
                  type="button"
                  onClick={copyTxId}
                  className="text-[#F5F5F3] hover:text-[#A5F36B] flex items-center gap-1 cursor-pointer"
                  title="Click to copy"
                >
                  <span className="truncate max-w-[130px]">{transaction.id}</span>
                  <span className="text-[10px]">{copied ? "✓" : "📋"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[#A0A0A4]">
                <span>Durability</span>
                <span className="text-[#A5F36B]">PostgreSQL (Port 5435)</span>
              </div>

              <div className="flex items-center justify-between text-[#A0A0A4]">
                <span>Workflow Type</span>
                <span className="text-[#F5F5F3]">4-Service Reference</span>
              </div>
            </div>
          </Panel>

          {/* Section 2: Authoritative State List */}
          <Panel title="AUTHORITATIVE STATE" subtitle="REAL-TIME REMOTE">
            <div className="divide-y divide-white/[0.04] space-y-2 pt-1 font-mono text-[11.5px]">
              {/* Database */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[#F5F5F3] text-[12px] font-sans font-medium">Database Service</div>
                  <div className="text-[10.5px] text-[#66686D]">PostgreSQL schema</div>
                </div>
                <StatusPill status={getResourceStatus("database").status} size="sm" />
              </div>

              {/* Backend */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[#F5F5F3] text-[12px] font-sans font-medium">Compute Service</div>
                  <div className="text-[10.5px] text-[#66686D]">Backend runtime</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={getResourceStatus("backend").status} size="sm" />
                  {getResourceStatus("backend").sublink && (
                    <a
                      href={getResourceStatus("backend").sublink?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#A5F36B] hover:underline text-[10.5px]"
                    >
                      ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Routing */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[#F5F5F3] text-[12px] font-sans font-medium">Routing Service</div>
                  <div className="text-[10.5px] text-[#66686D]">Gateway proxy route</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={getResourceStatus("routing").status} size="sm" />
                  {getResourceStatus("routing").sublink && (
                    <a
                      href={getResourceStatus("routing").sublink?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#A5F36B] hover:underline text-[10.5px]"
                    >
                      ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Frontend */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[#F5F5F3] text-[12px] font-sans font-medium">Frontend Service</div>
                  <div className="text-[10.5px] text-[#66686D]">Preview deployment</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={getResourceStatus("frontend").status} size="sm" />
                  {getResourceStatus("frontend").sublink && (
                    <a
                      href={getResourceStatus("frontend").sublink?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#A5F36B] hover:underline text-[10.5px]"
                    >
                      ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {/* Section 3: Recent Activity Log */}
          <Panel title="RECENT EVENTS" subtitle="LATEST 5">
            {recentEvents.length === 0 ? (
              <div className="py-4 text-center text-[#66686D] text-[11px] font-mono">
                No events recorded yet. Run a scenario above.
              </div>
            ) : (
              <div className="space-y-2.5 font-mono text-[11px]">
                {recentEvents.map((ev, idx) => (
                  <div key={idx} className="flex items-start justify-between border-b border-white/[0.04] pb-2">
                    <div className="space-y-0.5">
                      <span className="text-[#F5F5F3] block font-medium">{ev.type}</span>
                      <span className="text-[#66686D] text-[10px]">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-[#66686D] text-[10px]">#{eventLog.length - idx}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Diagnostics Slide-Over Drawer */}
      <DiagnosticsDrawer
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        title="Transaction Coordinator State"
        data={{
          transaction,
          authoritativeState,
          recentEventsCount: eventLog.length,
          coordinatorPort: 3000,
          databasePort: 5435,
        }}
      />
    </div>
  );
}
