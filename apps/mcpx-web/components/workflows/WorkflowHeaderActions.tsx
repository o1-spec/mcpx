"use client";

interface WorkflowHeaderActionsProps {
  isRunning: boolean;
  stepCount: number;
  onRunWorkflow: () => void;
  onOpenDiagnostics: () => void;
  onDeletePrompt: () => void;
}

export default function WorkflowHeaderActions({
  isRunning,
  stepCount,
  onRunWorkflow,
  onOpenDiagnostics,
  onDeletePrompt,
}: WorkflowHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onRunWorkflow}
        disabled={isRunning || stepCount === 0}
        className="px-4 py-2 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-1.5"
      >
        {isRunning ? "Running Pipeline…" : "Execute Workflow →"}
      </button>

      <button
        type="button"
        onClick={onOpenDiagnostics}
        className="px-3 py-2 rounded font-mono text-xs text-muted hover:text-foreground bg-white/3 hover:bg-white/6 border border-white/8 transition-colors cursor-pointer"
      >
        Diagnostics ↗
      </button>

      <button
        type="button"
        onClick={onDeletePrompt}
        className="px-3 py-2 rounded font-mono text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-rose-500/20 transition-colors cursor-pointer"
      >
        Delete
      </button>
    </div>
  );
}
