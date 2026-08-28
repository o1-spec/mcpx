"use client";

import { useState, useEffect, useCallback } from "react";
import WebMCPRegistrar from "@/components/WebMCPRegistrar";
import type { BackendRecord } from "@/lib/store";

export default function ComputeAppPage() {
  const [backends, setBackends] = useState<BackendRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    supported: boolean;
    registered: boolean;
    tools: string[];
    error?: string;
  }>({
    supported: false,
    registered: false,
    tools: ["deploy_backend", "get_backend", "delete_backend"],
  });

  const fetchBackends = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/backends");
      const data = await res.json();
      if (data.backends && Array.isArray(data.backends)) {
        setBackends(data.backends);
      }
    } catch (err) {
      console.error("Failed to fetch backends:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackends();
    const interval = setInterval(fetchBackends, 2000);
    return () => clearInterval(interval);
  }, [fetchBackends]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Compute Service
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Port 3003 • WebMCP Resource Provider for Backend Compute Deployments
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                localhost:3003
              </span>
            </div>
          </div>
        </header>

        {/* WebMCP Registrar Component */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            WebMCP Status
          </h2>
          <WebMCPRegistrar onStatusChange={setStatus} />
        </section>

        {/* Exposed Tools Card */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Exposed WebMCP Tools ({status.tools.length})
            </h2>
            <span className="text-xs text-slate-400">
              Target: <code className="text-indigo-300">http://localhost:3000</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {status.tools.map((toolName) => (
              <div
                key={toolName}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">✓</span>
                  <code className="text-sm font-mono font-medium text-slate-200">
                    {toolName}
                  </code>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {toolName === "deploy_backend"
                    ? "POST"
                    : toolName === "get_backend"
                    ? "GET"
                    : "DELETE"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Live Backend Store State */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                In-Memory Backend Store
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {backends.length} active
              </span>
            </div>
            <button
              onClick={fetchBackends}
              disabled={loading}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium cursor-pointer"
            >
              {loading ? "Refreshing..." : "Refresh Store"}
            </button>
          </div>

          {backends.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
              No backend instances deployed. Trigger <code className="text-indigo-400">deploy_backend</code> via WebMCP.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-2 px-3">Operation Key</th>
                    <th className="py-2 px-3">Project</th>
                    <th className="py-2 px-3">DB Resource</th>
                    <th className="py-2 px-3">Resource ID</th>
                    <th className="py-2 px-3">Health URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {backends.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-indigo-300 font-semibold">
                        {b.operationKey}
                      </td>
                      <td className="py-2 px-3">{b.projectName}</td>
                      <td className="py-2 px-3 text-emerald-400">{b.databaseResourceId.slice(0, 8)}...</td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">{b.id}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{b.healthUrl}</td>
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
