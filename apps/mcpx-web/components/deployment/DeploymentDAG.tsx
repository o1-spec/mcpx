"use client";

import type { TransactionModel, TransactionNode } from "@/types/reliability";
import { stateColors } from "@/components/reliability/StatePipeline";

interface DeploymentDAGProps {
  transaction: TransactionModel;
}

export default function DeploymentDAG({ transaction }: DeploymentDAGProps) {
  const dbNode = transaction.nodes.find((n) => n.id === "database:create");
  const backendNode = transaction.nodes.find((n) => n.id === "backend:deploy");
  const routingNode = transaction.nodes.find((n) => n.id === "routing:create");
  const frontendNode = transaction.nodes.find((n) => n.id === "frontend:deploy");

  const renderNode = (node?: TransactionNode, colorClass = "border-slate-800") => {
    if (!node) return null;
    const colors = stateColors[node.state] ?? stateColors.PENDING;

    return (
      <div
        className={`p-3.5 rounded-xl border transition-all ${
          colors.border || colorClass
        } bg-slate-900/70 space-y-1.5 shadow-sm text-left`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-xs text-slate-200 uppercase font-sans">
            {node.service}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${colors.badge}`}
          >
            {node.state}
          </span>
        </div>

        <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
          <div className="truncate">
            <span className="text-slate-500">Tool:</span> {node.executeTool}
          </div>
          <div className="truncate">
            <span className="text-slate-500">Key:</span>{" "}
            <span className="text-slate-300">{node.operationKey}</span>
          </div>
          {node.resourceId && (
            <div className="truncate">
              <span className="text-slate-500">ID:</span>{" "}
              <span className="text-emerald-400 font-semibold">{node.resourceId}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-950/70 space-y-4 text-center">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block font-sans">
          4-Service Deployment Topology (DAG)
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          Dependency-driven resolution
        </span>
      </div>

      {/* Layer 1: Database */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          {renderNode(dbNode, "border-emerald-500/40")}
        </div>
      </div>

      {/* Arrow Layer 1 -> Layer 2 */}
      <div className="flex flex-col items-center text-slate-500">
        <span className="text-xs font-mono text-slate-500">↓ databaseResourceId</span>
      </div>

      {/* Layer 2: Compute Backend */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          {renderNode(backendNode, "border-indigo-500/40")}
        </div>
      </div>

      {/* Arrow Layer 2 -> Layer 3 (Split to Routing & Frontend) */}
      <div className="flex items-center justify-center gap-16 text-slate-500 text-xs font-mono">
        <span>↙ backendResourceId</span>
        <span>↘ backendResourceId</span>
      </div>

      {/* Layer 3: Routing & Frontend (Parallel Dependents) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div>{renderNode(routingNode, "border-cyan-500/40")}</div>
        <div>{renderNode(frontendNode, "border-violet-500/40")}</div>
      </div>
    </div>
  );
}
