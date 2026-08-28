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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-slate-800 pb-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Database Service
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              PostgreSQL schema resource plane for WebMCP transactions
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
              Port 3002
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
              Host: <code className="text-slate-300 font-mono">http://localhost:3000</code>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {status.tools.map((toolName) => (
              <div
                key={toolName}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800/60 bg-slate-950/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-xs">✓</span>
                  <code className="text-xs font-mono text-slate-200">
                    {toolName}
                  </code>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
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

        {/* Real PostgreSQL Schemas */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                PostgreSQL resources
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                {databases.length} active
              </span>
            </div>
            <button
              onClick={fetchDatabases}
              disabled={loading}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium cursor-pointer"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {databases.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
              No active schemas. Real PostgreSQL schemas are provisioned and dropped dynamically via WebMCP.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Operation key</th>
                    <th className="py-2.5 px-3">Schema name</th>
                    <th className="py-2.5 px-3">Resource ID</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300 font-mono text-[11px]">
                  {databases.map((db) => (
                    <tr key={db.id} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 text-indigo-300">
                        {db.operationKey}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-sans font-medium">
                        {db.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{db.id.slice(0, 8)}...</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-sans">Active</td>
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
