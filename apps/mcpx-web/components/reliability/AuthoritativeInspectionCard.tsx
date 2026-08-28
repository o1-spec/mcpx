"use client";

import type { AuthoritativeState, TransactionNode } from "@/types/reliability";

interface AuthoritativeInspectionCardProps {
  authoritativeState: AuthoritativeState;
  transactionNode: TransactionNode;
}

export default function AuthoritativeInspectionCard({
  authoritativeState,
  transactionNode,
}: AuthoritativeInspectionCardProps) {
  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="font-semibold uppercase tracking-wider text-slate-300 font-sans">
          Authoritative Inspection
        </span>
        {authoritativeState.inspected && (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${authoritativeState.exists
                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                : "bg-rose-950 text-rose-300 border border-rose-500/40"
              }`}
          >
            {authoritativeState.exists ? "Resource Exists: YES" : "Resource Exists: NO"}
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-slate-300">
        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-500">Resource Exists:</span>
          <span className={authoritativeState.exists ? "text-emerald-400 font-bold" : "text-slate-400"}>
            {authoritativeState.inspected ? (authoritativeState.exists ? "YES" : "NO") : "—"}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-500">Resource ID:</span>
          <span className="text-indigo-300 font-semibold truncate max-w-50">
            {authoritativeState.route?.id || transactionNode.resourceId || "—"}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-500">Operation Key:</span>
          <span className="text-cyan-300 font-semibold truncate max-w-50">
            {transactionNode.operationKey || "—"}
          </span>
        </div>
        {transactionNode.lastError && (
          <div className="pt-1 text-rose-300 text-[11px]">
            <span className="font-bold">Last Error:</span> {transactionNode.lastError}
          </div>
        )}
      </div>
    </div>
  );
}
