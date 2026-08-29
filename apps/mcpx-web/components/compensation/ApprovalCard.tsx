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
    <div className="border border-amber-500/40 bg-[#080A0B] p-5 space-y-4 text-left font-mono text-[11.5px]">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-[13px] font-semibold text-amber-300 uppercase tracking-tight">
            Rollback approval required
          </span>
        </div>
        <p className="text-[11.5px] text-[#969B9E]">
          Frontend failed before committing. 3 existing resources can be removed safely in reverse dependency order.
        </p>
      </div>

      {/* Two columns: Existing resources vs Rollback order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 border border-white/[0.06] bg-[#0C0E0F] space-y-1.5">
          <span className="text-[10px] text-[#65696B] uppercase block">
            Existing resources
          </span>
          <ul className="space-y-1 text-[#F2F3F1] text-[11px]">
            <li className="flex items-center gap-1.5 text-[#A5F36B]">
              <span>✓</span> Database (PostgreSQL schema)
            </li>
            <li className="flex items-center gap-1.5 text-[#A5F36B]">
              <span>✓</span> Backend (Compute runtime)
            </li>
            <li className="flex items-center gap-1.5 text-[#A5F36B]">
              <span>✓</span> Routing (Gateway route)
            </li>
            <li className="flex items-center gap-1.5 text-[#65696B] pt-1 border-t border-white/[0.04]">
              <span>✕</span> Frontend was never created
            </li>
          </ul>
        </div>

        <div className="p-3 border border-white/[0.06] bg-[#0C0E0F] space-y-1.5">
          <span className="text-[10px] text-[#65696B] uppercase block">
            Rollback sequence
          </span>
          <div className="space-y-1 text-[#F2F3F1] text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-[#65696B]">01</span>
              <span>Routing gateway (delete_route)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#65696B]">02</span>
              <span>Compute backend (delete_backend)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#65696B]">03</span>
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
          className="w-full sm:w-auto px-4 py-2 rounded font-mono text-[11.5px] font-semibold bg-amber-400 hover:bg-amber-300 text-[#080A0B] transition-colors cursor-pointer disabled:opacity-50"
        >
          Approve rollback
        </button>

        <button
          onClick={onReject}
          disabled={disabled}
          className="w-full sm:w-auto px-4 py-2 rounded font-mono text-[11.5px] text-[#969B9E] hover:text-[#F2F3F1] hover:bg-white/[0.04] border border-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
        >
          Keep resources
        </button>
      </div>
    </div>
  );
}
