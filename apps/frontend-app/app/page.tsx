"use client";

import { useState, useEffect, useCallback } from "react";
import WebMCPRegistrar from "@/components/WebMCPRegistrar";
import type { FrontendRecord } from "@/lib/db";

export default function FrontendAppPage() {
  const [frontends, setFrontends] = useState<FrontendRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    supported: boolean;
    registered: boolean;
    tools: string[];
    error?: string;
  }>({
    supported: false,
    registered: false,
    tools: ["deploy_frontend", "get_frontend", "delete_frontend"],
  });

  const fetchFrontends = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/frontends");
      const data = await res.json();
      if (data.frontends && Array.isArray(data.frontends)) {
        setFrontends(data.frontends);
      }
    } catch (err) {
      console.error("Failed to fetch frontends:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFrontends();
    const interval = setInterval(fetchFrontends, 2000);
    return () => clearInterval(interval);
  }, [fetchFrontends]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-slate-800 pb-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-violet-400"></span>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Frontend Service
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Frontend preview host for WebMCP applications
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
              Port 3004
            </span>
          </div>
        </header>

        {/* WebMCP Registrar Component */}
        <section className="space-y-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
            WebMCP status
          </span>
          <WebMCPRegistrar onStatusChange={setStatus} />
        </section>

        {/* Exposed Tools */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Exposed WebMCP tools ({status.tools.length})
            </span>
            <span className="text-xs text-slate-400">
              Coordinator: <code className="text-slate-300 font-mono">{process.env.NEXT_PUBLIC_MCPX_ORIGIN || "http://localhost:3000"}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {status.tools.map((toolName) => (
              <div
                key={toolName}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800/60 bg-slate-950/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-violet-400 text-xs">✓</span>
                  <code className="text-xs font-mono text-slate-200">
                    {toolName}
                  </code>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {toolName === "deploy_frontend"
                    ? "POST"
                    : toolName === "get_frontend"
                    ? "GET"
                    : "DELETE"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Frontend Previews */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Frontend deployments
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                {frontends.length} active
              </span>
            </div>
            <button
              onClick={fetchFrontends}
              disabled={loading}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium cursor-pointer"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {frontends.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
              No active frontend deployments. Application previews are built and rolled back dynamically via WebMCP.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Operation key</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Backend resource</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300 font-mono text-[11px]">
                  {frontends.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 text-indigo-300">
                        {f.operationKey}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-white">{f.projectName}</td>
                      <td className="py-2.5 px-3 text-slate-400">{f.backendResourceId.slice(0, 8)}...</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-sans">Live · HTTP 200</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
