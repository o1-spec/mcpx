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
    <div className="border border-amber-500/40 bg-background p-5 space-y-4 text-left font-mono text-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-tight">
            Rollback approval required
          </span>
        </div>
        <p className="text-xs text-muted">
          Frontend failed before committing. 3 existing resources can be removed safely in reverse dependency order.
        </p>
      </div>

      {/* Two columns: Existing resources vs Rollback order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 border border-white/6 bg-panel space-y-1.5">
          <span className="text-xs text-subtle uppercase block">
            Existing resources
          </span>
          <ul className="space-y-1 text-foreground text-xs">
            <li className="flex items-center gap-1.5 text-accent-lime">
              <span>✓</span> Database (PostgreSQL schema)
            </li>
            <li className="flex items-center gap-1.5 text-accent-lime">
              <span>✓</span> Backend (Compute runtime)
            </li>
            <li className="flex items-center gap-1.5 text-accent-lime">
              <span>✓</span> Routing (Gateway route)
            </li>
            <li className="flex items-center gap-1.5 text-subtle pt-1 border-t border-white/4">
              <span>✕</span> Frontend was never created
            </li>
          </ul>
        </div>

        <div className="p-3 border border-white/6 bg-panel space-y-1.5">
          <span className="text-xs text-subtle uppercase block">
            Rollback sequence
          </span>
          <div className="space-y-1 text-foreground text-xs">
            <div className="flex items-center gap-2">
              <span className="text-subtle">01</span>
              <span>Routing gateway (delete_route)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-subtle">02</span>
              <span>Compute backend (delete_backend)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-subtle">03</span>
              <span>Database schema (CASCADE)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="w-full sm:w-auto px-4 py-2 rounded font-mono text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-background transition-colors cursor-pointer disabled:opacity-50"
        >
          Approve rollback
        </button>

        <button
          onClick={onReject}
          disabled={disabled}
          className="w-full sm:w-auto px-4 py-2 rounded font-mono text-xs text-muted hover:text-foreground hover:bg-white/4 border border-white/6 transition-colors cursor-pointer disabled:opacity-50"
        >
          Keep resources
        </button>
      </div>
    </div>
  );
}
