"use client";

import type { DiscoveredToolInfo } from "@/types/reliability";

interface WebMCPBridgeStatusProps {
  isRoutingConnected: boolean;
  isDatabaseConnected: boolean;
  isSupported: boolean | null;
  routingTools: DiscoveredToolInfo[];
  databaseTools: DiscoveredToolInfo[];
  discoveryError: string | null;
  onRefreshTools: () => void;
  disabled?: boolean;
}

export default function WebMCPBridgeStatus({
  isRoutingConnected,
  isDatabaseConnected,
  isSupported,
  routingTools,
  databaseTools,
  discoveryError,
  onRefreshTools,
  disabled,
}: WebMCPBridgeStatusProps) {
  const expectedRoutingTools = ["create_route", "get_route", "delete_route"];
  const expectedDatabaseTools = ["create_database", "get_database", "delete_database"];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Header with status badges and refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Cross-Origin WebMCP Bridges
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browser-native tool delegation to <code className="text-cyan-300">localhost:3001</code> and <code className="text-emerald-300">localhost:3002</code>
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

      {/* Two Service Grids: Routing & Database */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Routing Service */}
        <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isRoutingConnected ? "bg-cyan-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span className="font-bold text-sm text-slate-200">Routing Service</span>
              <span className="text-xs text-slate-500 font-mono">:3001</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isRoutingConnected
                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/40"
                  : "bg-rose-950/80 text-rose-300 border-rose-500/40"
              }`}
            >
              {isRoutingConnected ? "CONNECTED" : "NOT CONNECTED"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 font-mono text-xs">
            {expectedRoutingTools.map((expectedName) => {
              const match = routingTools.find((t) => t.name === expectedName);
              const isDiscovered = !!match;
              return (
                <div
                  key={expectedName}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                    isDiscovered
                      ? "border-cyan-500/30 bg-cyan-950/20 text-cyan-200"
                      : "border-slate-800/80 bg-slate-900/30 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={isDiscovered ? "text-cyan-400 font-bold" : "text-slate-600"}>
                      {isDiscovered ? "✓" : "○"}
                    </span>
                    <span>{expectedName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">http://localhost:3001</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Service */}
        <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isDatabaseConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span className="font-bold text-sm text-slate-200">Database Service</span>
              <span className="text-xs text-slate-500 font-mono">:3002</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isDatabaseConnected
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-950/80 text-rose-300 border-rose-500/40"
              }`}
            >
              {isDatabaseConnected ? "CONNECTED" : "NOT CONNECTED"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 font-mono text-xs">
            {expectedDatabaseTools.map((expectedName) => {
              const match = databaseTools.find((t) => t.name === expectedName);
              const isDiscovered = !!match;
              return (
                <div
                  key={expectedName}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                    isDiscovered
                      ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
                      : "border-slate-800/80 bg-slate-900/30 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={isDiscovered ? "text-emerald-400 font-bold" : "text-slate-600"}>
                      {isDiscovered ? "✓" : "○"}
                    </span>
                    <span>{expectedName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">http://localhost:3002</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
