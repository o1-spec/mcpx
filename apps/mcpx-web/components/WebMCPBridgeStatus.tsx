"use client";

import type { DiscoveredToolInfo } from "@/types/reliability";
import { origins } from "@/lib/config/origins";

interface WebMCPBridgeStatusProps {
  isDatabaseConnected: boolean;
  isComputeConnected: boolean;
  isRoutingConnected: boolean;
  isFrontendConnected: boolean;
  isSupported: boolean | null;
  databaseTools: DiscoveredToolInfo[];
  computeTools: DiscoveredToolInfo[];
  routingTools: DiscoveredToolInfo[];
  frontendTools: DiscoveredToolInfo[];
  discoveryError: string | null;
  onRefreshTools: () => void;
  disabled?: boolean;
}

export default function WebMCPBridgeStatus({
  isDatabaseConnected,
  isComputeConnected,
  isRoutingConnected,
  isFrontendConnected,
  isSupported,
  databaseTools,
  computeTools,
  routingTools,
  frontendTools,
  discoveryError,
  onRefreshTools,
  disabled,
}: WebMCPBridgeStatusProps) {
  const services = [
    {
      name: "Database Service",
      port: origins.database.includes("localhost") ? ":3002" : "Cloud",
      origin: origins.database,
      color: "emerald",
      connected: isDatabaseConnected,
      tools: ["create_database", "get_database", "delete_database"],
      discovered: databaseTools,
    },
    {
      name: "Compute Service",
      port: origins.compute.includes("localhost") ? ":3003" : "Cloud",
      origin: origins.compute,
      color: "indigo",
      connected: isComputeConnected,
      tools: ["deploy_backend", "get_backend", "delete_backend"],
      discovered: computeTools,
    },
    {
      name: "Routing Service",
      port: origins.routing.includes("localhost") ? ":3001" : "Cloud",
      origin: origins.routing,
      color: "cyan",
      connected: isRoutingConnected,
      tools: ["create_route", "get_route", "delete_route"],
      discovered: routingTools,
    },
    {
      name: "Frontend Service",
      port: origins.frontend.includes("localhost") ? ":3004" : "Cloud",
      origin: origins.frontend,
      color: "violet",
      connected: isFrontendConnected,
      tools: ["deploy_frontend", "get_frontend", "delete_frontend"],
      discovered: frontendTools,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Cross-Origin WebMCP Bridges (4 Microservices)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Zero-broker browser delegation across <code className="text-emerald-300">:3002</code>, <code className="text-indigo-300">:3003</code>, <code className="text-cyan-300">:3001</code>, and <code className="text-violet-300">:3004</code>
          </p>
        </div>

        <div>
          <button
            onClick={onRefreshTools}
            disabled={disabled}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 shadow-sm cursor-pointer disabled:opacity-50"
          >
            Refresh Tools
          </button>
        </div>
      </div>

      {isSupported === false && (
        <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
          <span className="text-base">⚠️</span>
          <div>
            <span className="font-semibold">WebMCP API Notice:</span>{" "}
            <code>document.modelContext</code> is not present in this browser window.
          </div>
        </div>
      )}

      {discoveryError && (
        <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs space-y-1 font-mono">
          <div className="font-bold flex items-center gap-1.5 text-rose-400">
            <span>✕</span> getTools() Exception:
          </div>
          <div className="break-all text-[11px]">{discoveryError}</div>
        </div>
      )}

      {/* 4-Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {services.map((svc) => (
          <div
            key={svc.name}
            className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    svc.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                  }`}
                />
                <span className="font-bold text-xs text-slate-200">{svc.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{svc.port}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                  svc.connected
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                    : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                }`}
              >
                {svc.connected ? "CONNECTED" : "OFFLINE"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
              {svc.tools.map((expectedName) => {
                const isDiscovered = svc.discovered.some((t) => t.name === expectedName);
                return (
                  <div
                    key={expectedName}
                    className={`flex items-center justify-between p-1.5 rounded-md border transition-all ${
                      isDiscovered
                        ? "border-slate-700/80 bg-slate-900/60 text-slate-200"
                        : "border-slate-800/80 bg-slate-900/20 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={isDiscovered ? "text-emerald-400 font-bold" : "text-slate-600"}>
                        {isDiscovered ? "✓" : "○"}
                      </span>
                      <span>{expectedName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
