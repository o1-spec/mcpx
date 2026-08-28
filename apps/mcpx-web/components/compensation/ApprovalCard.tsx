"use client";

interface ApprovalCardProps {
  resourceId?: string;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export default function ApprovalCard({
  onApprove,
  onReject,
  disabled,
}: ApprovalCardProps) {
  return (
    <div className="p-6 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-5 text-left transition-all">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Rollback required
          </h3>
        </div>
        <p className="text-xs text-slate-300">
          Frontend was rejected before commit. MCPx will safely roll back existing resources in reverse dependency order.
        </p>
      </div>

      {/* Two columns: Existing resources vs Rollback order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
            Existing resources
          </span>
          <ul className="space-y-1.5 text-slate-300">
            <li className="flex items-center gap-2 text-emerald-400">
              <span>✓</span> Database (PostgreSQL schema active)
            </li>
            <li className="flex items-center gap-2 text-indigo-400">
              <span>✓</span> Backend (Compute runtime active)
            </li>
            <li className="flex items-center gap-2 text-cyan-400">
              <span>✓</span> Routing (Gateway route active)
            </li>
            <li className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800/60">
              <span>—</span> Frontend was never created
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
            Rollback order
          </span>
          <div className="space-y-2 pt-1 font-medium text-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono text-[11px]">1</span>
              <span>Routing gateway</span>
            </div>
            <div className="text-slate-500 pl-4 text-xs font-mono">↓</div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono text-[11px]">2</span>
              <span>Compute backend</span>
            </div>
            <div className="text-slate-500 pl-4 text-xs font-mono">↓</div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono text-[11px]">3</span>
              <span>Database schema (CASCADE)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          Approve rollback
        </button>

        <button
          onClick={onReject}
          disabled={disabled}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg font-medium text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          Keep resources
        </button>
      </div>
    </div>
  );
}
