"use client";

import Link from "next/link";

interface ContractReadinessRailProps {
  serviceId: string;
  isReady: boolean;
  executeToolName: string;
  inspectToolName: string;
  hasCompensate: boolean;
  execAcceptsKey: boolean;
  inspAcceptsKey: boolean;
  assertionsValid: boolean;
  validationIssues: string[];
  isSaving: boolean;
}

export default function ContractReadinessRail({
  serviceId,
  isReady,
  executeToolName,
  inspectToolName,
  hasCompensate,
  execAcceptsKey,
  inspAcceptsKey,
  assertionsValid,
  validationIssues,
  isSaving,
}: ContractReadinessRailProps) {
  return (
    <div className="space-y-5 lg:sticky lg:top-24">
      <div className="p-5 border border-white/9 bg-panel font-mono text-xs space-y-4">
        <div className="flex items-center justify-between border-b border-white/6 pb-2">
          <span className="text-xs text-subtle uppercase tracking-wider">
            CONTRACT READINESS
          </span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
              isReady
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                : "bg-amber-950/60 text-amber-300 border-amber-500/40"
            }`}
          >
            {isReady ? "READY" : "NEEDS REVIEW"}
          </span>
        </div>

        {/* Checklist */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Execute tool selected</span>
            <span className={executeToolName ? "text-emerald-400" : "text-subtle"}>
              {executeToolName ? "✓" : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">Inspect tool selected</span>
            <span className={inspectToolName ? "text-emerald-400" : "text-subtle"}>
              {inspectToolName ? "✓" : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">Compensation handler</span>
            <span className={hasCompensate ? "text-emerald-400" : "text-subtle"}>
              {hasCompensate ? "✓ Configured" : "None (Optional)"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">Identity parameter</span>
            <span className={execAcceptsKey && inspAcceptsKey ? "text-emerald-400" : "text-amber-400"}>
              {execAcceptsKey && inspAcceptsKey ? "✓ Validated" : "⚠ Check matrix"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">Developer assertions</span>
            <span className={assertionsValid ? "text-emerald-400" : "text-amber-400"}>
              {assertionsValid ? "✓ Confirmed" : "⚠ Pending"}
            </span>
          </div>
        </div>

        {/* Issues List */}
        {validationIssues.length > 0 && (
          <div className="pt-3 border-t border-white/4 space-y-1.5">
            <span className="text-xs text-amber-400 uppercase block">
              {validationIssues.length} {validationIssues.length === 1 ? "issue" : "issues"} to resolve:
            </span>
            <ul className="space-y-1 text-xs text-muted font-sans">
              {validationIssues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400">×</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Bar */}
        <div className="pt-4 border-t border-white/6 flex items-center justify-between gap-3">
          <Link
            href={`/app/services/${serviceId}`}
            className="px-3 py-2 text-subtle hover:text-foreground font-mono text-xs transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded bg-foreground text-background hover:bg-white font-semibold font-mono text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isSaving ? "Saving…" : "Save contract"}
          </button>
        </div>
      </div>
    </div>
  );
}
