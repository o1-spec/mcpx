"use client";

import Panel from "@/components/ui/Panel";
import StatusPill from "@/components/ui/StatusPill";
import ApprovalCard from "@/components/compensation/ApprovalCard";
import EventTimeline from "@/components/reliability/EventTimeline";
import type { TransactionEvent } from "@/types/reliability";

export interface RuntimeNodeState {
  id: string;
  label: string;
  service: string;
  state: "PENDING" | "EXECUTING" | "SUCCEEDED" | "IN_DOUBT" | "RECONCILING" | "RECOVERED" | "FAILED" | "COMPENSATING" | "COMPENSATED";
  resourceId?: string;
  error?: string;
  operationKey: string;
  origin: string;
  executeTool: string;
  inspectTool: string;
  compensateTool?: string | null;
  operationKeyField: string;
  dependencies: string[];
}

interface WorkflowRuntimePipelineProps {
  activeTxId: string;
  activeTxState: string | null;
  runtimeNodes: RuntimeNodeState[];
  awaitingApproval: boolean;
  isRunning: boolean;
  events: TransactionEvent[];
  onApproveRollback: () => void;
  onRejectApproval: () => void;
  onClearEvents: () => void;
}

export default function WorkflowRuntimePipeline({
  activeTxId,
  activeTxState,
  runtimeNodes,
  awaitingApproval,
  isRunning,
  events,
  onApproveRollback,
  onRejectApproval,
  onClearEvents,
}: WorkflowRuntimePipelineProps) {
  return (
    <Panel
      title="ACTIVE TRANSACTION PIPELINE"
      badge={<StatusPill status={activeTxState || "ACTIVE"} size="sm" />}
      actions={<span className="font-mono text-xs text-muted">{activeTxId}</span>}
    >
      <div className="space-y-6">
        {/* Dynamic Step Nodes Visual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {runtimeNodes.map((node) => (
            <div
              key={node.id}
              className={`p-3.5 border rounded space-y-2 transition-colors ${
                node.state === "SUCCEEDED" || node.state === "RECOVERED"
                  ? "border-emerald-500/30 bg-emerald-950/20"
                  : node.state === "COMPENSATED"
                    ? "border-white/8 bg-background"
                    : node.state === "FAILED"
                      ? "border-rose-500/30 bg-rose-950/20"
                      : node.state === "EXECUTING" || node.state === "RECONCILING"
                        ? "border-cyan-500/40 bg-cyan-950/20 animate-pulse"
                        : node.state === "IN_DOUBT"
                          ? "border-amber-500/40 bg-amber-950/20 animate-pulse"
                          : "border-white/8 bg-background"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground font-sans">
                  {node.label}
                </span>
                <StatusPill status={node.state} size="sm" />
              </div>

              <div className="text-xs text-muted font-mono space-y-0.5">
                <div>{node.service}</div>
                <div className="text-subtle truncate">{node.operationKey}</div>
                {node.resourceId && (
                  <div className="text-accent-lime text-xs">id: {node.resourceId}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Approval Safety Gate */}
        {awaitingApproval && (
          <ApprovalCard
            onApprove={onApproveRollback}
            onReject={onRejectApproval}
            disabled={isRunning}
          />
        )}

        {/* Event Timeline */}
        <div className="pt-4 border-t border-white/6">
          <div className="text-xs font-mono text-subtle uppercase mb-3">
            Live Transaction Log
          </div>
          <EventTimeline eventLog={events} onClearLog={onClearEvents} />
        </div>
      </div>
    </Panel>
  );
}
