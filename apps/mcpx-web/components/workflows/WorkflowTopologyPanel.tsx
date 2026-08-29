"use client";

import Panel from "@/components/ui/Panel";
import type { WorkflowNodeRecord, ReliabilityContractRecord, ConnectedServiceRecord } from "@/lib/db";

export interface EnrichedNode extends WorkflowNodeRecord {
  contract?: ReliabilityContractRecord;
  service?: ConnectedServiceRecord;
}

interface WorkflowTopologyPanelProps {
  enrichedNodes: EnrichedNode[];
}

export default function WorkflowTopologyPanel({ enrichedNodes }: WorkflowTopologyPanelProps) {
  return (
    <Panel
      title={`PIPELINE TOPOLOGY (${enrichedNodes.length} STEPS)`}
      subtitle="DAG EXECUTION GRAPH"
    >
      <div className="divide-y divide-white/4 font-mono text-xs">
        {enrichedNodes.map((node, idx) => (
          <div
            key={node.id}
            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded bg-white/6 border border-white/8 flex items-center justify-center font-mono text-xs text-muted">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-foreground font-sans">
                  {node.label}
                </span>
                <span className="text-xs text-subtle">
                  ({node.service?.name || "Service"})
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="text-accent-lime">{node.contract?.executeToolName}</span>
                <span className="text-subtle">→</span>
                <span className="text-cyan-300">{node.contract?.inspectToolName}</span>
                {node.contract?.compensateToolName && (
                  <>
                    <span className="text-subtle">→</span>
                    <span className="text-rose-300">{node.contract?.compensateToolName}</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-xs text-subtle text-left sm:text-right">
              {node.dependencies.length > 0
                ? `Depends on: ${node.dependencies.join(", ")}`
                : "Root Step"}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
