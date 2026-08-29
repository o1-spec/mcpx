"use client";

import { useState } from "react";
import type { ConnectedServiceRecord, ReliabilityContractRecord } from "@/lib/db";

interface ServiceSidebarRailProps {
  service: ConnectedServiceRecord;
  contracts: ReliabilityContractRecord[];
  isReferenceService: boolean;
  toolCount: number;
}

export default function ServiceSidebarRail({
  service,
  contracts,
  isReferenceService,
  toolCount,
}: ServiceSidebarRailProps) {
  const [showDevDetails, setShowDevDetails] = useState(false);

  const readyContractsCount = contracts.filter((c) => c.status === "READY").length;
  const reviewContractsCount = contracts.filter((c) => c.status !== "READY").length;

  return (
    <div className="space-y-5">
      {/* Reference Service Notice */}
      {isReferenceService && (
        <div className="p-4 border border-white/9 bg-[#0F1012] font-mono text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent-lime" />
            <span className="text-accent-lime font-bold text-xs uppercase">
              REFERENCE SERVICE
            </span>
          </div>
          <p className="text-muted font-sans text-xs leading-relaxed">
            Preconfigured reference service providing sample WebMCP tools and deterministic reliability contracts.
          </p>
        </div>
      )}

      {/* Service & Connection Overview */}
      <div className="p-5 border border-white/9 bg-panel font-mono text-xs space-y-4">
        <div className="text-xs text-subtle uppercase tracking-wider border-b border-white/6 pb-2">
          WEBMCP CONNECTION
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-subtle block text-xs">ORIGIN</span>
            <span className="text-foreground font-bold break-all">{service.origin}</span>
          </div>

          <div>
            <span className="text-subtle block text-xs">EXPOSURE</span>
            <span className="text-emerald-400">Allowed for MCPx origin</span>
          </div>

          <div>
            <span className="text-subtle block text-xs">DISCOVERED TOOLS</span>
            <span className="text-foreground">{toolCount} tools registered</span>
          </div>

          <div>
            <span className="text-subtle block text-xs">REGISTERED AT</span>
            <span className="text-muted">
              {new Date(service.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Reliability Contract Readiness Summary */}
      <div className="p-5 border border-white/9 bg-panel font-mono text-xs space-y-3">
        <div className="text-xs text-subtle uppercase tracking-wider border-b border-white/6 pb-2">
          RELIABILITY SUMMARY
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Contracts configured</span>
            <span className="text-foreground font-bold">{contracts.length}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-emerald-400">Ready for workflows</span>
            <span className="text-emerald-400 font-bold">{readyContractsCount}</span>
          </div>

          {reviewContractsCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-amber-400">Needs review</span>
              <span className="text-amber-400 font-bold">{reviewContractsCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Developer Details (Collapsible) */}
      <div className="p-4 border border-white/6 bg-background font-mono text-xs space-y-2">
        <button
          type="button"
          onClick={() => setShowDevDetails(!showDevDetails)}
          className="w-full flex items-center justify-between text-subtle hover:text-muted transition-colors cursor-pointer"
        >
          <span>DEVELOPER DETAILS</span>
          <span>{showDevDetails ? "▾" : "▸"}</span>
        </button>

        {showDevDetails && (
          <div className="space-y-2 pt-2 text-xs text-muted border-t border-white/4">
            <div>Service ID: <code className="text-foreground">{service.id}</code></div>
            <div>Transport: <code className="text-cyan-300">postMessage (JSON-RPC 2.0)</code></div>
            <div>Isolation: <code className="text-emerald-400">Sandboxed Iframe</code></div>
            <div>Updated: <code>{new Date(service.updatedAt).toISOString()}</code></div>
          </div>
        )}
      </div>
    </div>
  );
}
