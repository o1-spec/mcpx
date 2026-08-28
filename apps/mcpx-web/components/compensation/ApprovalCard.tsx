"use client";

interface ApprovalCardProps {
  resourceId?: string;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export default function ApprovalCard({
  resourceId,
  onApprove,
  onReject,
  disabled,
}: ApprovalCardProps) {
  return (
    <div className="p-5 rounded-xl border border-amber-500/50 bg-amber-950/30 space-y-4 shadow-xl">
      <div className="flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-200">
            Human Compensation Approval Required
          </h4>
          <p className="text-xs text-amber-300/90 leading-relaxed">
            Routing failed with confirmed rejection. 1 previously-created resource must be removed to restore the transaction.
          </p>
          {resourceId && (
            <div className="text-xs font-mono text-amber-100 bg-amber-900/40 px-2.5 py-1.5 rounded border border-amber-500/30 inline-block mt-1">
              Database Resource ID: <span className="font-bold">{resourceId}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          [ APPROVE COMPENSATION ]
        </button>

        <button
          onClick={onReject}
          disabled={disabled}
          className="py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          [ KEEP RESOURCES ]
        </button>
      </div>
    </div>
  );
}
