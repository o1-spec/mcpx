"use client";

import type { TransactionModel } from "@/types/reliability";
import { stateColors } from "@/components/reliability/StatePipeline";

interface TransactionDAGProps {
  transaction: TransactionModel;
}

export default function TransactionDAG({ transaction }: TransactionDAGProps) {
  const dbNode = transaction.nodes.find((n) => n.id === "database:create");
  const routeNode = transaction.nodes.find((n) => n.id === "routing:create");

  return (
    <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-950/70 space-y-4 font-mono text-xs">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block font-sans">
        Saga Dependency Graph (2 Nodes)
      </span>

      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Node 1: Database */}
        <div
          className={`flex-1 w-full p-4 rounded-xl border transition-all ${dbNode ? stateColors[dbNode.state].border : "border-slate-800"
            } bg-slate-900/60`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-200">1. DATABASE</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${dbNode ? stateColors[dbNode.state].badge : ""
                }`}
            >
              {dbNode?.state ?? "PENDING"}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>
              <span className="text-slate-500">Tool:</span> create_database
            </div>
            <div>
              <span className="text-slate-500">Key:</span>{" "}
              <span className="text-emerald-300 truncate inline-block max-w-45 align-bottom">
                {dbNode?.operationKey}
              </span>
            </div>
            {dbNode?.resourceId && (
              <div>
                <span className="text-slate-500">Resource ID:</span>{" "}
                <span className="text-indigo-300">{dbNode.resourceId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dependency Arrow */}
        <div className="flex flex-col items-center justify-center text-slate-500">
          <span className="text-xs font-sans text-slate-500 font-semibold mb-1">dependency</span>
          <span className="text-lg font-bold text-slate-400">→</span>
        </div>

        {/* Node 2: Routing */}
        <div
          className={`flex-1 w-full p-4 rounded-xl border transition-all ${routeNode ? stateColors[routeNode.state].border : "border-slate-800"
            } bg-slate-900/60`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-200">2. ROUTING</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${routeNode ? stateColors[routeNode.state].badge : ""
                }`}
            >
              {routeNode?.state ?? "PENDING"}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>
              <span className="text-slate-500">Tool:</span> create_route
            </div>
            <div>
              <span className="text-slate-500">Key:</span>{" "}
              <span className="text-cyan-300 truncate inline-block max-w-45 align-bottom">
                {routeNode?.operationKey}
              </span>
            </div>
            {routeNode?.lastError && (
              <div className="text-rose-400 text-xs pt-1 truncate max-w-55">
                <span className="font-bold">Error:</span> {routeNode.lastError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
