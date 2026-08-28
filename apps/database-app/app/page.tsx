"use client";

import { useState, useEffect, useCallback } from "react";
import WebMCPRegistrar from "@/components/WebMCPRegistrar";
import type { DatabaseRecord } from "@/lib/store";

export default function DatabaseAppPage() {
  const [databases, setDatabases] = useState<DatabaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    supported: boolean;
    registered: boolean;
    tools: string[];
    error?: string;
  }>({
    supported: false,
    registered: false,
    tools: ["create_database", "get_database", "delete_database"],
  });

  const fetchDatabases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/databases");
      const data = await res.json();
      if (data.databases && Array.isArray(data.databases)) {
        setDatabases(data.databases);
      }
    } catch (err) {
      console.error("Failed to fetch databases:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatabases();
    const interval = setInterval(fetchDatabases, 2000);
    return () => clearInterval(interval);
  }, [fetchDatabases]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Database Service
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Port 3002 • WebMCP Resource Provider for Database Operations
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                localhost:3002
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
              Target: <code className="text-emerald-300">http://localhost:3000</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {status.tools.map((toolName) => (
              <div
                key={toolName}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <code className="text-sm font-mono font-medium text-slate-200">
                    {toolName}
                  </code>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {toolName === "create_database"
                    ? "POST"
                    : toolName === "get_database"
                    ? "GET"
                    : "DELETE"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Live Database Store State */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                In-Memory Database Store
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {databases.length} active
              </span>
            </div>
            <button
              onClick={fetchDatabases}
              disabled={loading}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium cursor-pointer"
            >
              {loading ? "Refreshing..." : "Refresh Store"}
            </button>
          </div>

          {databases.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
              No databases in store yet. Trigger <code className="text-emerald-400">create_database</code> via WebMCP from mcpx-web (:3000).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-2 px-3">Operation Key</th>
                    <th className="py-2 px-3">Database Name</th>
                    <th className="py-2 px-3">Resource ID</th>
                    <th className="py-2 px-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {databases.map((db) => (
                    <tr key={db.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-emerald-300 font-semibold">
                        {db.operationKey}
                      </td>
                      <td className="py-2 px-3">{db.name}</td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">{db.id}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {new Date(db.createdAt).toLocaleTimeString()}
                      </td>
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
