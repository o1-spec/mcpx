"use client";

import { useState } from "react";
import type { TransactionEvent } from "@/types/reliability";

interface EventTimelineProps {
  eventLog: TransactionEvent[];
  onClearLog: () => void;
}

function getEventNarrative(ev: TransactionEvent): {
  title: string;
  subtext?: string;
  dotColor: string;
} {
  switch (ev.type) {
    case "TX_CREATED":
      return {
        title: "Transaction initialized in durable store",
        dotColor: "bg-slate-500",
      };

    case "DATABASE_EXECUTE_STARTED":
      return {
        title: "Creating isolated PostgreSQL schema",
        dotColor: "bg-indigo-400",
      };
    case "DATABASE_EXECUTE_SUCCEEDED":
      return {
        title: "PostgreSQL schema created",
        dotColor: "bg-emerald-400",
      };

    case "COMPUTE_EXECUTE_STARTED":
      return {
        title: "Deploying compute backend",
        dotColor: "bg-indigo-400",
      };
    case "COMPUTE_EXECUTE_SUCCEEDED":
      return {
        title: "Backend runtime became healthy",
        dotColor: "bg-emerald-400",
      };

    case "ROUTING_EXECUTE_STARTED":
      return {
        title: "Configuring routing gateway",
        dotColor: "bg-indigo-400",
      };
    case "ROUTING_EXECUTE_UNCERTAIN":
    case "ROUTING_MARKED_IN_DOUBT":
      return {
        title: "Routing response lost",
        subtext: "Outcome unknown · Transport ACK dropped",
        dotColor: "bg-amber-400",
      };
    case "ROUTING_RECONCILIATION_STARTED":
      return {
        title: "Inspecting authoritative routing state",
        dotColor: "bg-indigo-400",
      };
    case "ROUTING_REMOTE_STATE_FOUND":
      return {
        title: "Route confirmed present in microservice store",
        dotColor: "bg-teal-400",
      };
    case "ROUTING_RECOVERED":
      return {
        title: "Route found during reconciliation",
        subtext: "Recovered without retrying duplicate write",
        dotColor: "bg-emerald-400",
      };

    case "FRONTEND_EXECUTE_STARTED":
      return {
        title: "Building frontend preview deployment",
        dotColor: "bg-indigo-400",
      };
    case "FRONTEND_EXECUTE_FAILED":
      return {
        title: "Frontend rejected before commit",
        subtext: "Confirmed failure · No resource created",
        dotColor: "bg-rose-400",
      };

    case "TX_ABORT_STARTED":
      return {
        title: "Transaction aborted — initiating rollback",
        dotColor: "bg-amber-400",
      };
    case "COMPENSATION_APPROVAL_REQUIRED":
      return {
        title: "Rollback approval required",
        subtext: "Safety gate triggered for human confirmation",
        dotColor: "bg-amber-400",
      };
    case "COMPENSATION_APPROVED":
      return {
        title: "Rollback approved by operator",
        dotColor: "bg-indigo-400",
      };

    case "ROUTING_COMPENSATION_STARTED":
      return {
        title: "Unbinding routing gateway",
        dotColor: "bg-indigo-400",
      };
    case "ROUTING_COMPENSATION_VERIFIED":
      return {
        title: "Routing gateway removed and verified absent",
        dotColor: "bg-slate-400",
      };

    case "COMPUTE_COMPENSATION_STARTED":
      return {
        title: "De-provisioning compute backend",
        dotColor: "bg-indigo-400",
      };
    case "COMPUTE_COMPENSATION_VERIFIED":
      return {
        title: "Compute backend removed and verified absent",
        dotColor: "bg-slate-400",
      };

    case "DATABASE_COMPENSATION_STARTED":
      return {
        title: "Dropping PostgreSQL schema CASCADE",
        dotColor: "bg-indigo-400",
      };
    case "DATABASE_COMPENSATION_VERIFIED":
      return {
        title: "PostgreSQL schema dropped and verified absent",
        dotColor: "bg-slate-400",
      };

    case "TX_COMPENSATED":
      return {
        title: "Transaction safely rolled back",
        subtext: "All 3 created resources removed · 0 resources remain",
        dotColor: "bg-emerald-400",
      };
    case "TX_COMMITTED":
      return {
        title: "Deployment committed",
        subtext: "All 4 microservices active and serving traffic",
        dotColor: "bg-emerald-400",
      };

    case "COORDINATOR_RECOVERY_EXECUTING_TO_RECONCILING":
      return {
        title: "Coordinator restored from durable state",
        subtext: "Resuming authoritative reconciliation",
        dotColor: "bg-amber-400",
      };
    case "COORDINATOR_RECOVERY_RECOVERED":
      return {
        title: "Reconciliation completed after reload",
        dotColor: "bg-emerald-400",
      };

    default:
      return {
        title: ev.type.replace(/_/g, " ").toLowerCase(),
        dotColor: "bg-slate-500",
      };
  }
}

export default function EventTimeline({ eventLog, onClearLog }: EventTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
          Event timeline ({eventLog.length})
        </h3>
        {eventLog.length > 0 && (
          <button
            onClick={onClearLog}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-5 space-y-4 max-h-90 overflow-y-auto">
        {eventLog.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No events recorded yet. Run a scenario to start the transaction.
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
            {eventLog.map((ev, index) => {
              const { title, subtext, dotColor } = getEventNarrative(ev);
              const isExpanded = expandedIds.has(ev.id);
              const seqLabel = ev.sequence ? `#${ev.sequence}` : `#${index + 1}`;
              const timeStr = new Date(ev.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline dot */}
                  <span
                    className={`absolute -left-6.75 top-1 h-2.5 w-2.5 rounded-full ${dotColor} ring-4 ring-slate-950`}
                  ></span>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">
                          {title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {seqLabel}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {timeStr}
                      </span>
                    </div>

                    {subtext && (
                      <p className="text-xs text-slate-400 font-normal">
                        {subtext}
                      </p>
                    )}

                    {ev.details && Object.keys(ev.details).length > 0 && (
                      <div className="pt-0.5">
                        <button
                          onClick={() => toggleExpand(ev.id)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 font-mono transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{isExpanded ? "▾" : "▸"}</span>
                          <span>payload</span>
                        </button>

                        {isExpanded && (
                          <pre className="mt-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all">
                            {JSON.stringify(ev.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
