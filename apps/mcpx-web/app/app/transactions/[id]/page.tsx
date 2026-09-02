"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusPill from "@/components/ui/StatusPill";

interface TransactionDetail {
  id: string;
  state: string;
  scenario: string;
  workflowId?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  nodes: Array<{
    id: string;
    service: string;
    label: string;
    origin: string;
    state: string;
    executeTool: string;
    inspectTool: string;
    compensateTool?: string;
    operationKey: string;
    resourceId?: string;
    lastError?: string;
    dependencies: string[];
  }>;
}

interface TransactionEvent {
  id: string;
  sequence: number;
  nodeId?: string;
  type: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const txId = resolvedParams.id;

  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/transactions/${txId}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setTx(data.transaction);
        setEvents(data.events || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [txId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm font-mono text-muted animate-pulse">
        Loading transaction audit details...
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Transaction Not Found"
          description={`Could not find transaction with ID: ${txId}`}
          actions={
            <Link
              href="/app/transactions"
              className="px-3.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-mono text-foreground border border-white/10 transition-colors"
            >
              ← Back to Transactions
            </Link>
          }
        />
        <div className="p-6 border border-rose-500/30 bg-rose-950/20 text-rose-300 rounded font-mono text-xs">
          {error || "Transaction record does not exist in PostgreSQL ledger."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        title={`Transaction: ${tx.id}`}
        description={`Audit record for workflow "${tx.scenario}"`}
        badge={tx.state}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/app/transactions"
              className="px-3.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-mono text-foreground border border-white/10 transition-colors"
            >
              ← All Transactions
            </Link>
          </div>
        }
      />

      {/* 2. Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded bg-panel border border-white/8 space-y-1">
          <span className="text-subtle text-[11px] uppercase">Status</span>
          <div>
            <StatusPill status={tx.state} size="sm" showDot={true} />
          </div>
        </div>
        <div className="p-3.5 rounded bg-panel border border-white/8 space-y-1">
          <span className="text-subtle text-[11px] uppercase">Workflow</span>
          <div className="text-foreground font-medium truncate">{tx.scenario}</div>
        </div>
        <div className="p-3.5 rounded bg-panel border border-white/8 space-y-1">
          <span className="text-subtle text-[11px] uppercase">Created At</span>
          <div className="text-muted">{new Date(tx.createdAt).toLocaleTimeString()}</div>
        </div>
        <div className="p-3.5 rounded bg-panel border border-white/8 space-y-1">
          <span className="text-subtle text-[11px] uppercase">Durability</span>
          <div className="text-accent-lime font-medium">PostgreSQL Ledger</div>
        </div>
      </div>

      {/* 3. Microservice Nodes Table */}
      <div className="rounded border border-white/8 bg-panel overflow-hidden font-mono text-xs">
        <div className="px-4 py-3 border-b border-white/8 bg-background flex items-center justify-between">
          <span className="font-bold text-foreground uppercase tracking-wider text-[11.5px]">
            EXECUTION NODES ({tx.nodes.length})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/6 text-subtle text-[10.5px] uppercase bg-background">
                <th className="py-2.5 px-4">Node</th>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">Tool</th>
                <th className="py-2.5 px-4">Resource ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4 text-muted">
              {tx.nodes.map((node) => (
                <tr key={node.id} className="hover:bg-white/2">
                  <td className="py-3 px-4 text-foreground font-semibold font-mono">
                    {node.label || node.id}
                  </td>
                  <td className="py-3 px-4 font-sans text-muted">{node.service}</td>
                  <td className="py-3 px-4">
                    <StatusPill status={node.state} size="sm" showDot={true} />
                  </td>
                  <td className="py-3 px-4 text-cyan-400 font-mono text-[11px]">
                    {node.executeTool}
                  </td>
                  <td className="py-3 px-4 text-amber-300 font-mono text-[11px] truncate max-w-xs">
                    {node.resourceId || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Cryptographic Event History */}
      <div className="rounded border border-white/8 bg-panel p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/6 pb-2">
          <span className="font-bold text-foreground uppercase tracking-wider text-[11.5px]">
            EVENT AUDIT TRAIL ({events.length})
          </span>
        </div>
        {events.length === 0 ? (
          <div className="text-center py-6 text-subtle">No discrete events recorded.</div>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded border border-white/6 bg-background flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-subtle text-[10.5px]">#{ev.sequence}</span>
                  <span className="text-accent-lime font-bold text-xs">{ev.type}</span>
                  {ev.nodeId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/6 text-muted">
                      {ev.nodeId}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
