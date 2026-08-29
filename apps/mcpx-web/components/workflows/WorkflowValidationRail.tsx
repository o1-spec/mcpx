"use client";

import Link from "next/link";

interface WorkflowValidationRailProps {
  isFormValid: boolean;
  stepCount: number;
  isCyclic: boolean;
  allContractsSelected: boolean;
  isSaving: boolean;
}

export default function WorkflowValidationRail({
  isFormValid,
  stepCount,
  isCyclic,
  allContractsSelected,
  isSaving,
}: WorkflowValidationRailProps) {
  return (
    <div className="lg:sticky lg:top-24 font-mono text-xs">
      <div className="p-5 border border-white/9 bg-panel space-y-4">
        <div className="flex items-center justify-between border-b border-white/6 pb-2">
          <span className="text-xs text-subtle uppercase tracking-wider">
            DAG VALIDATION
          </span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
              isFormValid
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                : "bg-amber-950/60 text-amber-300 border-amber-500/40"
            }`}
          >
            {isFormValid ? "READY TO RUN" : "NEEDS ATTENTION"}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Step count</span>
            <span className="text-emerald-400">✓ {stepCount} {stepCount > 1 ? "steps" : "step"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">Acyclic graph</span>
            <span className={isCyclic ? "text-rose-400 font-bold" : "text-emerald-400"}>
              {isCyclic ? "✕ Cycle detected" : "✓ No cycles"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">Reliability contracts</span>
            <span className={allContractsSelected ? "text-emerald-400" : "text-amber-400"}>
              {allContractsSelected ? "✓ All mapped" : "⚠ Incomplete"}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/6 flex items-center justify-between gap-3">
          <Link
            href="/app/workflows"
            className="px-3 py-2 text-subtle hover:text-foreground font-mono text-xs transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!isFormValid || isSaving}
            className="px-4 py-2 rounded bg-foreground text-background hover:bg-white font-semibold font-mono text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isSaving ? "Saving…" : "Save workflow"}
          </button>
        </div>
      </div>
    </div>
  );
}
