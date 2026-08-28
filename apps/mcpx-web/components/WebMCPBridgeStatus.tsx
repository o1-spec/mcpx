"use client";

import type { DiscoveredToolInfo } from "@/types/reliability";

interface WebMCPBridgeStatusProps {
  isConnected: boolean;
  isSupported: boolean | null;
  discoveredTools: DiscoveredToolInfo[];
  discoveryError: string | null;
  onRefreshTools: () => void;
  disabled?: boolean;
}

export default function WebMCPBridgeStatus({
  isConnected,
  isSupported,
  discoveredTools,
  discoveryError,
  onRefreshTools,
  disabled,
}: WebMCPBridgeStatusProps) {
  const expectedToolNames = ["create_route", "get_route", "delete_route"];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Routing Service
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isConnected
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-950/80 text-rose-400 border border-rose-500/30"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              {isConnected ? "CONNECTED" : "NOT CONNECTED"}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cross-origin WebMCP bridge to <code className="text-cyan-300">http://localhost:3001</code>
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

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Discovered tools: {discoveredTools.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-sm">
          {expectedToolNames.map((expectedName) => {
            const match = discoveredTools.find((t) => t.name === expectedName);
            const isDiscovered = !!match;
            return (
              <div
                key={expectedName}
                className={`flex flex-col gap-1 p-3 rounded-xl border transition-all ${
                  isDiscovered
                    ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                    : "border-slate-800/80 bg-slate-950/40 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={isDiscovered ? "text-emerald-400 font-bold" : "text-slate-600"}>
                    {isDiscovered ? "✓" : "○"}
                  </span>
                  <span className="font-medium text-xs sm:text-sm">{expectedName}</span>
                </div>
                {isDiscovered && match.origin && (
                  <div className="text-[10px] text-emerald-400/70 pl-5">
                    origin: {match.origin}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
