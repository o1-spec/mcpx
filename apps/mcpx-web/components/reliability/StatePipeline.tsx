"use client";

import type { NodeState } from "@/types/reliability";

export const stateColors: Record<NodeState, { badge: string; pill: string; border: string }> = {
  PENDING: {
    badge: "bg-slate-800 text-slate-400 border-slate-700",
    pill: "bg-slate-800 text-slate-400 border-slate-700",
    border: "border-slate-800",
  },
  EXECUTING: {
    badge: "bg-cyan-950 text-cyan-300 border-cyan-500/50 animate-pulse",
    pill: "bg-cyan-600 text-white shadow-lg shadow-cyan-500/30",
    border: "border-cyan-500/50",
  },
  SUCCEEDED: {
    badge: "bg-emerald-950 text-emerald-300 border-emerald-500/50",
    pill: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30",
    border: "border-emerald-500/50",
  },
  IN_DOUBT: {
    badge: "bg-amber-950 text-amber-300 border-amber-500/60 animate-pulse",
    pill: "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/40",
    border: "border-amber-500/60",
  },
  RECONCILING: {
    badge: "bg-indigo-950 text-indigo-300 border-indigo-500/60 animate-pulse",
    pill: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40",
    border: "border-indigo-500/60",
  },
  RECOVERED: {
    badge: "bg-emerald-950 text-emerald-300 border-emerald-500/60",
    pill: "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/40",
    border: "border-emerald-500/60",
  },
  FAILED: {
    badge: "bg-rose-950 text-rose-300 border-rose-500/60",
    pill: "bg-rose-600 text-white shadow-lg shadow-rose-500/30",
    border: "border-rose-500/60",
  },
  COMPENSATING: {
    badge: "bg-indigo-950 text-indigo-300 border-indigo-500/60 animate-pulse",
    pill: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40",
    border: "border-indigo-500/60",
  },
  COMPENSATED: {
    badge: "bg-emerald-950 text-emerald-300 border-emerald-500/60 font-bold",
    pill: "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/40",
    border: "border-emerald-500/60",
  },
  RECOVERY_RETRY_AVAILABLE: {
    badge: "bg-amber-950 text-amber-300 border-amber-500/80 font-bold animate-pulse",
    pill: "bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/40",
    border: "border-amber-500/80",
  },
  MANUAL_ATTENTION_REQUIRED: {
    badge: "bg-rose-950 text-rose-300 border-rose-500/80 font-bold animate-pulse",
    pill: "bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/40",
    border: "border-rose-500/80",
  },
  SKIPPED: {
    badge: "bg-slate-800/60 text-slate-500 border-slate-700/50",
    pill: "bg-slate-800 text-slate-500 border-slate-700",
    border: "border-slate-800/60",
  },
};

interface StatePipelineProps {
  currentState: NodeState;
}

export default function StatePipeline({ currentState }: StatePipelineProps) {
  const steps: NodeState[] = ["EXECUTING", "IN_DOUBT", "RECONCILING", "RECOVERED"];

  return (
    <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-950/70 space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
        Node State Transition Pipeline
      </span>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono font-semibold">
        {steps.map((step, idx) => {
          const isCurrent = currentState === step;
          const isPast =
            (step === "EXECUTING" &&
              ["IN_DOUBT", "RECONCILING", "RECOVERED", "SUCCEEDED"].includes(currentState)) ||
            (step === "IN_DOUBT" && ["RECONCILING", "RECOVERED"].includes(currentState)) ||
            (step === "RECONCILING" && ["RECOVERED"].includes(currentState));

          return (
            <div key={step} className="flex items-center gap-2 sm:gap-3">
              <div
                className={`px-3.5 py-1.5 rounded-lg border transition-all ${
                  isCurrent
                    ? stateColors[step].pill
                    : isPast
                    ? "bg-slate-800/80 text-slate-300 border-slate-700"
                    : "bg-slate-900/40 text-slate-600 border-slate-800"
                }`}
              >
                {isCurrent && <span className="mr-1.5 inline-block animate-ping text-xs">●</span>}
                {step}
              </div>
              {idx < steps.length - 1 && <span className="text-slate-600 font-bold">↓</span>}
            </div>
          );
        })}

        {currentState === "FAILED" && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-rose-500 font-bold">→</span>
            <div className="px-3.5 py-1.5 rounded-lg border bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/30">
              FAILED
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
