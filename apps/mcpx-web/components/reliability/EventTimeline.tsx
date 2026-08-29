"use client";

import { useState } from "react";
import type { TransactionEvent } from "@/types/reliability";

interface EventTimelineProps {
  eventLog: TransactionEvent[];
  onClearLog: () => void;
}

export default function EventTimeline({
  eventLog,
  onClearLog,
}: EventTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="border border-white/8 bg-panel p-4 sm:p-5 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">FULL EVENT LOG</span>
          <span className="text-xs px-2 py-0.5 rounded bg-white/4 text-muted">
            {eventLog.length} events
          </span>
        </div>

        {eventLog.length > 0 && (
          <button
            onClick={onClearLog}
            className="text-xs text-subtle hover:text-foreground transition-colors cursor-pointer"
          >
            Clear log
          </button>
        )}
      </div>

      {eventLog.length === 0 ? (
        <div className="py-6 text-center text-subtle text-xs">
          No events recorded yet. Run a scenario to stream live transaction events.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/6 text-subtle text-xs uppercase">
                <th className="py-2 px-2 font-normal">Seq</th>
                <th className="py-2 px-2 font-normal">Time</th>
                <th className="py-2 px-2 font-normal">Node</th>
                <th className="py-2 px-2 font-normal">Event</th>
                <th className="py-2 px-2 font-normal">Result</th>
                <th className="py-2 px-2 font-normal text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {eventLog.map((ev, idx) => {
                const isExpanded = expandedIndex === idx;
                const timeStr = new Date(ev.timestamp).toLocaleTimeString();
                const nodeStr = ev.nodeId || "Coordinator";
                
                let resultBadge = <span className="text-subtle">—</span>;
                if (ev.type.includes("SUCCEEDED") || ev.type.includes("RECOVERED") || ev.type.includes("COMPENSATED")) {
                  resultBadge = <span className="text-accent-lime">SUCCESS</span>;
                } else if (ev.type.includes("UNCERTAIN") || ev.type.includes("IN_DOUBT")) {
                  resultBadge = <span className="text-amber-400">IN_DOUBT</span>;
                } else if (ev.type.includes("FAILED")) {
                  resultBadge = <span className="text-rose-400">FAILED</span>;
                } else if (ev.type.includes("STARTED")) {
                  resultBadge = <span className="text-muted">STARTED</span>;
                }

                return (
                  <tr
                    key={idx}
                    onClick={() => toggleExpand(idx)}
                    className="hover:bg-white/2 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-2 text-subtle">#{idx + 1}</td>
                    <td className="py-2 px-2 text-muted">{timeStr}</td>
                    <td className="py-2 px-2 text-foreground font-semibold">{nodeStr}</td>
                    <td className="py-2 px-2 text-muted">{ev.type}</td>
                    <td className="py-2 px-2">{resultBadge}</td>
                    <td className="py-2 px-2 text-right text-subtle">
                      {isExpanded ? "▲" : "▼"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {expandedIndex !== null && eventLog[expandedIndex] && (
            <div className="mt-3 p-3 border border-white/6 bg-background text-xs">
              <div className="text-subtle pb-1">
                Event Payload (#{expandedIndex + 1} · {eventLog[expandedIndex].type}):
              </div>
              <pre className="overflow-x-auto text-foreground font-mono leading-tight">
                {JSON.stringify(eventLog[expandedIndex].details || eventLog[expandedIndex], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
