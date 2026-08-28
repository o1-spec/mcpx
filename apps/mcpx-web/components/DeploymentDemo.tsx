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

  // Authoritative Resource Display Logic (strictly scoped to current transaction state):
  const getResourceStatus = (
    service: "database" | "backend" | "routing" | "frontend"
  ): { label: string; style: string; sublink?: { url: string; text: string } } => {
    if (isCompensated) {
      if (service === "frontend") {
        return { label: "Never created ✓", style: "text-slate-400 font-medium" };
      }
      return { label: "Removed ✓", style: "text-slate-400 font-medium" };
    }

    if (service === "database") {
      if (dbNode?.state === "SUCCEEDED" && authoritativeState.database) {
        return {
          label: "Present",
          style: "text-emerald-400 font-medium",
        };
      }
      if (dbNode?.state === "COMPENSATED") {
        return { label: "Removed ✓", style: "text-slate-400 font-medium" };
      }
      return { label: "Not created", style: "text-slate-500" };
    }

    if (service === "backend") {
      if (backendNode?.state === "SUCCEEDED" && authoritativeState.backend) {
        return {
          label: "Healthy · HTTP 200",
          style: "text-emerald-400 font-medium",
          sublink: backendHealthUrl ? { url: backendHealthUrl, text: "Health ↗" } : undefined,
        };
      }
      if (backendNode?.state === "COMPENSATED") {
        return { label: "Removed ✓", style: "text-slate-400 font-medium" };
      }
      return { label: "Not created", style: "text-slate-500" };
    }

    if (service === "routing") {
      if (
        (routingNode?.state === "SUCCEEDED" || routingNode?.state === "RECOVERED") &&
        authoritativeState.routing
      ) {
        return {
          label: "Healthy · HTTP 200",
          style: "text-emerald-400 font-medium",
          sublink: routingGatewayUrl ? { url: routingGatewayUrl, text: "Gateway ↗" } : undefined,
        };
      }
      if (routingNode?.state === "COMPENSATED") {
        return { label: "Removed ✓", style: "text-slate-400 font-medium" };
      }
      return { label: "Not created", style: "text-slate-500" };
    }

    if (service === "frontend") {
      if (frontendNode?.state === "SUCCEEDED" && authoritativeState.frontend) {
        return {
          label: "Live · HTTP 200",
          style: "text-emerald-400 font-medium",
          sublink: frontendPreviewUrl ? { url: frontendPreviewUrl, text: "Preview ↗" } : undefined,
        };
      }
      if (frontendNode?.state === "FAILED") {
        return { label: "Never created ✓", style: "text-slate-400 font-medium" };
      }
      if (frontendNode?.state === "COMPENSATED") {
        return { label: "Never created ✓", style: "text-slate-400 font-medium" };
      }
      return { label: "Not created", style: "text-slate-500" };
    }

    return { label: "Not created", style: "text-slate-500" };
  };

  return (
    <section className="space-y-6">
      {/* 1. Scenario Controls Section */}
      <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
            Demo scenarios
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onInspectAll}
              disabled={isRunning}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Inspect resources
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={onReset}
              disabled={isRunning}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Primary Hero Control: Challenge Scenario */}
          <div className="md:col-span-8 p-5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                <h3 className="font-semibold text-sm text-white">
                  Challenge scenario
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recover a lost acknowledgement, handle a confirmed downstream failure, and safely roll back existing resources.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={() => onRunDeployment(true)}
                disabled={isRunning || !isConnected}
                className="px-5 py-2.5 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Executing scenario…</span>
                  </>
                ) : (
                  <span>Run challenge</span>
                )}
              </button>
            </div>
          </div>

          {/* Secondary Control: Happy Path */}
          <div className="md:col-span-4 p-5 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-white">
                Happy path
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deploy all four resources and open the resulting application.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={() => onRunDeployment(false)}
                disabled={isRunning || !isConnected}
                className="px-4 py-2.5 rounded-lg font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run happy path
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual 4-Node Live DAG */}
      <DeploymentDAG transaction={transaction} />

      {/* 3. Human Approval Intervention (Visible when Awaiting Approval) */}
      {isAwaitingApproval && (
        <ApprovalCard
          onApprove={onApproveCompensation}
          onReject={onRejectCompensation}
          disabled={isRunning}
        />
      )}

      {/* 4. Two-Column Outcome & Resource Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        {/* Left Column: Transaction summary */}
        <div className="md:col-span-6 p-5 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Transaction outcome
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {transaction.state.replace(/_/g, " ")}
            </span>
          </div>

          {/* Compensated Outcome */}
          {isCompensated && (
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  Transaction safely rolled back
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  MCPx removed every resource created by the failed workflow and verified the final state.
                </p>
              </div>

              <div className="space-y-1 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> Routing removed
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> Backend removed
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> Database schema removed
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span>—</span> Frontend never created
                </div>
              </div>

              <div className="text-xs font-medium text-emerald-400 pt-1">
                No resources remain.
              </div>
            </div>
          )}

          {/* Committed Outcome */}
          {isCommitted && frontendPreviewUrl && (
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  Deployment ready
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All four resources were created, bound via WebMCP, and verified.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={frontendPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-lg font-medium text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open application</span>
                  <span>↗</span>
                </a>
              </div>

              <div className="flex items-center gap-4 text-xs pt-1 text-slate-400">
                {backendHealthUrl && (
                  <a
                    href={backendHealthUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-indigo-300 transition-colors"
                  >
                    Backend health ↗
                  </a>
                )}
                {routingGatewayUrl && (
                  <a
                    href={routingGatewayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-cyan-300 transition-colors"
                  >
                    Routing gateway ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* In-Flight / Waiting State */}
          {!isCompensated && !isCommitted && (
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Current phase</span>
                <span className="font-medium text-slate-200">
                  {transaction.state === "CREATED"
                    ? "Ready"
                    : transaction.state === "EXECUTING"
                      ? "Executing workflow"
                      : transaction.state === "AWAITING_COMPENSATION_APPROVAL"
                        ? "Awaiting rollback approval"
                        : transaction.state === "COMPENSATING"
                          ? "Rolling back resources"
                          : transaction.state}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Durability</span>
                <span className="text-emerald-400">PostgreSQL connected</span>
              </div>
            </div>
          )}

          {/* Secondary Metadata */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <span>TX:</span>
              <span className="text-slate-400 truncate max-w-45">{transaction.id}</span>
              <button
                onClick={copyTxId}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <button
              onClick={() => onRehydrate(transaction.id)}
              disabled={isHydrating || isRunning}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isHydrating ? "reloading…" : "reload state"}
            </button>
          </div>
        </div>

        {/* Right Column: Authoritative state table */}
        <div className="md:col-span-6 p-5 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Authoritative state
            </h3>
            <span className="text-xs text-slate-500">Microservice catalog</span>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {/* Database */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="text-slate-300 font-medium block">Database</span>
                <span className="text-[11px] text-slate-500">PostgreSQL schema</span>
              </div>
              <span className={getResourceStatus("database").style}>
                {getResourceStatus("database").label}
              </span>
            </div>

            {/* Backend */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="text-slate-300 font-medium block">Backend</span>
                <span className="text-[11px] text-slate-500">Compute runtime</span>
              </div>
              <div className="text-right">
                <span className={getResourceStatus("backend").style}>
                  {getResourceStatus("backend").label}
                </span>
              </div>
            </div>

            {/* Routing */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="text-slate-300 font-medium block">Routing</span>
                <span className="text-[11px] text-slate-500">Gateway proxy</span>
              </div>
              <div className="text-right">
                <span className={getResourceStatus("routing").style}>
                  {getResourceStatus("routing").label}
                </span>
              </div>
            </div>

            {/* Frontend */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="text-slate-300 font-medium block">Frontend</span>
                <span className="text-[11px] text-slate-500">Preview host</span>
              </div>
              <div className="text-right">
                <span className={getResourceStatus("frontend").style}>
                  {getResourceStatus("frontend").label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Event Timeline */}
      <EventTimeline eventLog={eventLog} onClearLog={onClearLog} />
    </section>
  );
}
