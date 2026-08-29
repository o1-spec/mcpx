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
    <div className="border border-white/[0.08] bg-[#0C0E0F] p-4 sm:p-5 space-y-4 font-mono text-[11.5px]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[#F2F3F1]">FULL EVENT LOG</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-[#969B9E]">
            {eventLog.length} events
          </span>
        </div>

        {eventLog.length > 0 && (
          <button
            onClick={onClearLog}
            className="text-[11px] text-[#65696B] hover:text-[#F2F3F1] transition-colors cursor-pointer"
          >
            Clear log
          </button>
        )}
      </div>

      {eventLog.length === 0 ? (
        <div className="py-6 text-center text-[#65696B] text-[11px]">
          No events recorded yet. Run a scenario to stream live transaction events.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#65696B] text-[10px] uppercase">
                <th className="py-2 px-2 font-normal">Seq</th>
                <th className="py-2 px-2 font-normal">Time</th>
                <th className="py-2 px-2 font-normal">Node</th>
                <th className="py-2 px-2 font-normal">Event</th>
                <th className="py-2 px-2 font-normal">Result</th>
                <th className="py-2 px-2 font-normal text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {eventLog.map((ev, idx) => {
                const isExpanded = expandedIndex === idx;
                const timeStr = new Date(ev.timestamp).toLocaleTimeString();
                const nodeStr = ev.nodeId || "Coordinator";
                
                let resultBadge = <span className="text-[#65696B]">—</span>;
                if (ev.type.includes("SUCCEEDED") || ev.type.includes("RECOVERED") || ev.type.includes("COMPENSATED")) {
                  resultBadge = <span className="text-[#A5F36B]">SUCCESS</span>;
                } else if (ev.type.includes("UNCERTAIN") || ev.type.includes("IN_DOUBT")) {
                  resultBadge = <span className="text-amber-400">IN_DOUBT</span>;
                } else if (ev.type.includes("FAILED")) {
                  resultBadge = <span className="text-rose-400">FAILED</span>;
                } else if (ev.type.includes("STARTED")) {
                  resultBadge = <span className="text-[#969B9E]">STARTED</span>;
                }

                return (
                  <tr
                    key={idx}
                    onClick={() => toggleExpand(idx)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-2 text-[#65696B]">#{idx + 1}</td>
                    <td className="py-2 px-2 text-[#969B9E]">{timeStr}</td>
                    <td className="py-2 px-2 text-[#F2F3F1] font-semibold">{nodeStr}</td>
                    <td className="py-2 px-2 text-[#969B9E]">{ev.type}</td>
                    <td className="py-2 px-2">{resultBadge}</td>
                    <td className="py-2 px-2 text-right text-[#65696B]">
                      {isExpanded ? "▲" : "▼"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {expandedIndex !== null && eventLog[expandedIndex] && (
            <div className="mt-3 p-3 border border-white/[0.06] bg-[#080A0B] text-[10.5px]">
              <div className="text-[#65696B] pb-1">
                Event Payload (#{expandedIndex + 1} · {eventLog[expandedIndex].type}):
              </div>
              <pre className="overflow-x-auto text-[#F2F3F1] font-mono leading-tight">
                {JSON.stringify(eventLog[expandedIndex].details || eventLog[expandedIndex], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
