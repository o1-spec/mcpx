"use client";

import Link from "next/link";
import type { ReliabilityContractRecord } from "@/lib/db";

interface ServiceContractsListProps {
  serviceId: string;
  contracts: ReliabilityContractRecord[];
  toolCount: number;
}

export default function ServiceContractsList({
  serviceId,
  contracts,
  toolCount,
}: ServiceContractsListProps) {
  return (
    <section className="space-y-3 pt-4 border-t border-white/8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/6 pb-2.5">
        <div>
          <h2 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
            Reliability Contracts ({contracts.length})
          </h2>
          <p className="text-xs text-muted mt-0.5 font-sans">
            Map one consequential action to the tools MCPx should use to execute, inspect, and compensate it.
          </p>
        </div>

        <Link
          href={`/app/services/${encodeURIComponent(serviceId)}/contracts/new`}
          className="px-3 py-1.5 rounded bg-foreground text-background hover:bg-white font-semibold font-mono text-xs transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          + Create contract
        </Link>
      </div>

      {contracts.length === 0 ? (
        <div className="p-6 border border-dashed border-white/8 bg-panel text-center space-y-3 font-sans">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground block">
              No reliability contracts yet.
            </span>
            <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
              MCPx has discovered {toolCount} tools on this service, but none have been configured with execute, inspect, and compensation semantics.
            </p>
          </div>
          <Link
            href={`/app/services/${encodeURIComponent(serviceId)}/contracts/new`}
            className="px-3.5 py-1.5 rounded bg-foreground text-background font-mono text-xs font-semibold transition-colors inline-block cursor-pointer"
          >
            Create first contract →
          </Link>
        </div>
      ) : (
        <div className="border border-white/9 bg-panel divide-y divide-white/6 font-mono text-xs overflow-hidden">
          {/* Contracts Header */}
          <div className="hidden sm:grid sm:grid-cols-12 px-4 py-2 text-xs text-subtle uppercase tracking-wider bg-background">
            <div className="col-span-3">Contract</div>
            <div className="col-span-3">Execute</div>
            <div className="col-span-2">Inspect</div>
            <div className="col-span-2">Compensate</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* Contract Rows */}
          {contracts.map((ctr) => {
            const isReady = ctr.status === "READY";
            const isNeedsReview = ctr.status === "NEEDS_REVIEW";

            return (
              <div
                key={ctr.id}
                className="p-3.5 sm:px-4 sm:py-3 grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-0 hover:bg-white/1.5 transition-colors"
              >
                <div className="sm:col-span-3 space-y-0.5">
                  <Link
                    href={`/app/services/${encodeURIComponent(serviceId)}/contracts/${encodeURIComponent(ctr.id)}`}
                    className="font-bold text-foreground hover:text-accent-lime transition-colors block font-sans text-xs"
                  >
                    {ctr.name}
                  </Link>
                  <span className="text-xs text-subtle block font-mono">
                    ID: {ctr.operationKeyField}
                  </span>
                </div>

                <div className="sm:col-span-3 text-emerald-400 font-mono text-xs truncate">
                  {ctr.executeToolName}
                </div>

                <div className="sm:col-span-2 text-cyan-300 font-mono text-xs truncate">
                  {ctr.inspectToolName}
                </div>

                <div className="sm:col-span-2 text-amber-300 font-mono text-xs truncate">
                  {ctr.compensateToolName || <span className="text-subtle">None</span>}
                </div>

                <div className="sm:col-span-1">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border inline-block ${
                      isReady
                        ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                        : isNeedsReview
                          ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                          : "bg-rose-950/60 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {ctr.status}
                  </span>
                </div>

                <div className="sm:col-span-1 text-right">
                  <Link
                    href={`/app/services/${encodeURIComponent(serviceId)}/contracts/${encodeURIComponent(ctr.id)}`}
                    className="text-xs font-mono text-muted hover:text-foreground transition-colors"
                  >
                    Open →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
