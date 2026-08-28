"use client";

import type { TransactionModel, TransactionNode, NodeState } from "@/types/reliability";

interface DeploymentDAGProps {
  transaction: TransactionModel;
}

interface StateConfig {
  label: string;
  badge: string;
  dot: string;
  subtext?: string;
  pulse?: boolean;
}

function getNodeStateConfig(node: TransactionNode): StateConfig {
  switch (node.state) {
    case "PENDING":
      return {
        label: "Waiting",
        badge: "text-slate-400 bg-slate-800/80 border-slate-700/60",
        dot: "bg-slate-500",
      };
    case "EXECUTING":
      return {
        label: "Creating resource…",
        badge: "text-indigo-300 bg-indigo-950/80 border-indigo-500/40",
        dot: "bg-indigo-400",
        pulse: true,
      };
    case "IN_DOUBT":
      return {
        label: "Outcome unknown",
        badge: "text-amber-300 bg-amber-950/80 border-amber-500/60",
        dot: "bg-amber-400",
        subtext: "Response was lost after the request was sent.",
        pulse: true,
      };
    case "RECONCILING":
      return {
        label: "Checking authoritative state…",
        badge: "text-indigo-300 bg-indigo-950/80 border-indigo-500/50",
        dot: "bg-indigo-400",
        pulse: true,
      };
    case "RECOVERED":
      return {
        label: "Recovered",
        badge: "text-emerald-300 bg-emerald-950/80 border-emerald-500/50 font-medium",
        dot: "bg-emerald-400",
        subtext: "Resource confirmed — no duplicate write needed.",
      };
    case "SUCCEEDED":
      return {
        label: "Created",
        badge: "text-emerald-300 bg-emerald-950/80 border-emerald-500/50",
        dot: "bg-emerald-400",
      };
    case "FAILED":
      return {
        label: "Failed",
        badge: "text-rose-300 bg-rose-950/80 border-rose-500/50",
        dot: "bg-rose-400",
        subtext: "Rejected before commit. No resource was created.",
      };
    case "COMPENSATING":
      return {
        label: "Rolling back…",
        badge: "text-indigo-300 bg-indigo-950/80 border-indigo-500/40",
        dot: "bg-indigo-400",
        pulse: true,
      };
    case "COMPENSATED":
      return {
        label: "Removed",
        badge: "text-slate-400 bg-slate-900 border-slate-800",
        dot: "bg-slate-500",
        subtext: "Resource removal verified.",
      };
    default:
      return {
        label: node.state,
        badge: "text-slate-400 bg-slate-800 border-slate-700",
        dot: "bg-slate-500",
      };
  }
}

export default function DeploymentDAG({ transaction }: DeploymentDAGProps) {
  const dbNode = transaction.nodes.find((n) => n.id === "database:create");
  const backendNode = transaction.nodes.find((n) => n.id === "backend:deploy");
  const routingNode = transaction.nodes.find((n) => n.id === "routing:create");
  const frontendNode = transaction.nodes.find((n) => n.id === "frontend:deploy");

  const renderNode = (
    node?: TransactionNode,
    title = "Service",
    typeDescription = "Resource"
  ) => {
    if (!node) return null;
    const config = getNodeStateConfig(node);
    const shortResourceId = node.resourceId ? node.resourceId.slice(0, 8) : null;

    return (
      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2 text-left transition-all">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm text-white tracking-tight">
              {title}
            </h3>
            <span className="text-xs text-slate-400">{typeDescription}</span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${config.badge} ${
              config.pulse ? "animate-pulse" : ""
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`}></span>
            {config.label}
          </span>
        </div>

        {config.subtext && (
          <p className="text-xs text-slate-300 font-normal leading-relaxed">
            {config.subtext}
          </p>
        )}

        {shortResourceId && (
          <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Resource</span>
            <span className="font-mono text-slate-300">{shortResourceId}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/20 space-y-4 text-center">
      {/* Layer 1: Database */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          {renderNode(dbNode, "Database", "PostgreSQL schema")}
        </div>
      </div>

      {/* Connector: Layer 1 -> Layer 2 */}
      <div className="flex justify-center">
        <div className="h-6 w-px bg-slate-700"></div>
      </div>

      {/* Layer 2: Compute Backend */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          {renderNode(backendNode, "Backend", "Compute runtime")}
        </div>
      </div>

      {/* Connector: Layer 2 -> Layer 3 (Branching) */}
      <div className="flex justify-center items-center gap-24 sm:gap-40 text-slate-600 font-mono text-xs">
        <span className="h-6 w-px bg-slate-700 -rotate-25 transform origin-top"></span>
        <span className="h-6 w-px bg-slate-700 rotate-25 transform origin-top"></span>
      </div>

      {/* Layer 3: Routing & Frontend (Parallel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div>{renderNode(routingNode, "Routing", "Gateway proxy")}</div>
        <div>{renderNode(frontendNode, "Frontend", "Preview host")}</div>
      </div>
    </div>
  );
}
