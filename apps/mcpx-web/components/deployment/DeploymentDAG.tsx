"use client";

import type { TransactionModel, TransactionNode } from "@/types/reliability";

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
        label: "WAITING",
        badge: "text-subtle bg-white/3 border-white/6",
        dot: "bg-[#65696B]",
      };
    case "EXECUTING":
      return {
        label: "EXECUTING",
        badge: "text-white bg-white/8 border-white/20",
        dot: "bg-white",
        pulse: true,
      };
    case "IN_DOUBT":
      return {
        label: "IN_DOUBT",
        badge: "text-amber-300 bg-amber-950/80 border-amber-500/60",
        dot: "bg-amber-400",
        subtext: "Acknowledgement lost · Outcome unknown",
        pulse: true,
      };
    case "RECONCILING":
      return {
        label: "RECONCILING",
        badge: "text-cyan-300 bg-cyan-950/80 border-cyan-500/50",
        dot: "bg-cyan-400",
        subtext: "Checking authoritative store…",
        pulse: true,
      };
    case "RECOVERED":
      return {
        label: "RECOVERED",
        badge: "text-accent-lime bg-emerald-950/80 border-accent-lime/50 font-medium",
        dot: "bg-accent-lime",
        subtext: "Resource found · No duplicate write",
      };
    case "SUCCEEDED":
      return {
        label: "SUCCEEDED",
        badge: "text-accent-lime bg-emerald-950/80 border-accent-lime/40",
        dot: "bg-accent-lime",
      };
    case "FAILED":
      return {
        label: "FAILED",
        badge: "text-rose-300 bg-rose-950/80 border-rose-500/50",
        dot: "bg-rose-400",
        subtext: "Rejected before commit · No resource created",
      };
    case "COMPENSATING":
      return {
        label: "COMPENSATING",
        badge: "text-amber-300 bg-amber-950/80 border-amber-500/40",
        dot: "bg-amber-400",
        pulse: true,
      };
    case "COMPENSATED":
      return {
        label: "COMPENSATED",
        badge: "text-subtle bg-white/2 border-white/6",
        dot: "bg-[#65696B]",
        subtext: "Resource removal verified",
      };
    default:
      return {
        label: node.state,
        badge: "text-muted bg-white/4 border-white/6",
        dot: "bg-[#65696B]",
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

    return (
      <div className="border border-white/8 bg-background p-3.5 space-y-2 font-mono text-xs transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${config.dot} ${
                config.pulse ? "animate-pulse" : ""
              }`}
            />
            <span className="font-semibold text-foreground tracking-tight">{title}</span>
          </div>

          <span
            className={`px-2 py-0.5 text-xs font-mono border rounded ${config.badge}`}
          >
            {config.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-subtle">
          <span>{typeDescription}</span>
          {node.resourceId ? (
            <span className="text-muted truncate max-w-30">
              {node.resourceId.slice(0, 10)}
            </span>
          ) : null}
        </div>

        {config.subtext && (
          <div className="text-xs pt-1 text-muted border-t border-white/4 leading-tight">
            {config.subtext}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto py-2">
      {/* 1. Database Node */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          {renderNode(dbNode, "Database", "PostgreSQL schema")}
        </div>
      </div>

      {/* Connector 1 */}
      <div className="flex justify-center">
        <div
          className={`h-6 w-px transition-colors duration-200 ${
            dbNode?.state === "SUCCEEDED"
              ? "bg-accent-lime"
              : dbNode?.state === "COMPENSATED"
              ? "bg-white/10"
              : "bg-white/8"
          }`}
        />
      </div>

      {/* 2. Backend Node */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          {renderNode(backendNode, "Backend", "Compute runtime")}
        </div>
      </div>

      {/* Branch Connector */}
      <div className="flex justify-center items-center gap-28 sm:gap-40 py-1">
        <span
          className={`h-6 w-px -rotate-25 transform origin-top transition-colors ${
            backendNode?.state === "SUCCEEDED"
              ? "bg-accent-lime"
              : "bg-white/8"
          }`}
        />
        <span
          className={`h-6 w-px rotate-25 transform origin-top transition-colors ${
            backendNode?.state === "SUCCEEDED"
              ? "bg-accent-lime"
              : "bg-white/8"
          }`}
        />
      </div>

      {/* 3. Routing & Frontend Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>{renderNode(routingNode, "Routing", "Gateway proxy route")}</div>
        <div>{renderNode(frontendNode, "Frontend", "Application preview host")}</div>
      </div>
    </div>
  );
}
