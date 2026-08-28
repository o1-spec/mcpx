"use client";

import type { TransactionEvent } from "@/types/reliability";

interface EventLogListProps {
  eventLog: TransactionEvent[];
  onClearLog: () => void;
}

export default function EventLogList({ eventLog, onClearLog }: EventLogListProps) {
  return (
    <div className="lg:col-span-6 space-y-3 flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Chronological Event Log ({eventLog.length})
        </span>
        {eventLog.length > 0 && (
          <button
            onClick={onClearLog}
            className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer"
          >
            Clear Log
          </button>
        )}
      </div>

      <div className="flex-1 min-h-[300px] max-h-[420px] rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-y-auto space-y-2.5">
        {eventLog.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 italic">
            No events logged yet. Click [ RUN RELIABILITY DEMO ] to execute.
          </div>
        ) : (
          eventLog.map((ev, index) => {
            let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
            if (ev.type.includes("UNCERTAIN") || ev.type.includes("IN_DOUBT")) {
              badgeColor = "bg-amber-950 text-amber-300 border-amber-500/40";
            } else if (ev.type.includes("RECONCILIATION")) {
              badgeColor = "bg-indigo-950 text-indigo-300 border-indigo-500/40";
            } else if (ev.type.includes("RECOVERED") || ev.type.includes("FOUND")) {
              badgeColor = "bg-emerald-950 text-emerald-300 border-emerald-500/40";
            } else if (ev.type.includes("FAILED")) {
              badgeColor = "bg-rose-950 text-rose-300 border-rose-500/40";
            }

            return (
              <div
                key={ev.id}
                className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/40 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`px-2 py-0.5 rounded font-bold border ${badgeColor}`}>
                    {index + 1}. {ev.type}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {ev.details && (
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap break-all pt-1 pl-1">
                    {JSON.stringify(ev.details, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
