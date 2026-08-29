"use client";

import { useState, useEffect, useCallback } from "react";
import WebMCPRegistrar from "@/components/WebMCPRegistrar";
import type { RouteRecord } from "@/lib/db";

export default function RoutingAppPage() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [status, setStatus] = useState<{
    supported: boolean;
    registered: boolean;
    tools: string[];
    error?: string;
  }>({
    supported: false,
    registered: false,
    tools: ["create_route", "get_route", "delete_route"],
  });

  const fetchRoutes = useCallback(async () => {
    try {
      setLoadingRoutes(true);
      const res = await fetch("/api/routes");
      const data = await res.json();
      if (data.routes && Array.isArray(data.routes)) {
        setRoutes(data.routes);
      }
    } catch (err) {
      console.error("Failed to fetch routes:", err);
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
    const interval = setInterval(fetchRoutes, 2000);
    return () => clearInterval(interval);
  }, [fetchRoutes]);

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F5F3] font-sans p-6 sm:p-10 selection:bg-[#A5F36B] selection:text-[#070708]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-white/[0.08] pb-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <h1 className="text-[20px] font-bold tracking-tight text-[#F5F5F3] font-sans">
                Routing Service
              </h1>
            </div>
            <p className="text-[12.5px] text-[#A0A0A4]">
              Gateway routing proxy for WebMCP microservices
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-mono text-[#A0A0A4]">
            <span className="px-2.5 py-1 rounded bg-[#0B0C0E] border border-white/[0.09]">
              Port 3001
            </span>
          </div>
        </header>

        {/* WebMCP Registrar Component */}
        <section className="space-y-2">
          <span className="text-[11px] font-mono text-[#66686D] uppercase tracking-wider block">
            WebMCP STATUS
          </span>
          <WebMCPRegistrar onStatusChange={setStatus} />
        </section>

        {/* Exposed Tools */}
        <section className="border border-white/[0.09] bg-[#0B0C0E] p-5 space-y-3 font-mono text-[12px]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[11px]">
            <span className="font-bold text-[#F5F5F3] uppercase tracking-wider">
              EXPOSED WEBMCP TOOLS ({status.tools.length})
            </span>
            <span className="text-[#66686D]">
              Coordinator: <code className="text-[#A0A0A4]">{process.env.NEXT_PUBLIC_MCPX_ORIGIN || "http://localhost:3000"}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {status.tools.map((toolName) => (
              <div
                key={toolName}
                className="flex items-center justify-between p-3 border border-white/[0.06] bg-[#070708]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 text-xs">✓</span>
                  <code className="text-[12px] font-mono text-[#F5F5F3]">
                    {toolName}
                  </code>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[#A0A0A4]">
                  {toolName === "create_route"
                    ? "POST"
                    : toolName === "get_route"
                    ? "GET"
                    : "DELETE"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Active Routes */}
        <section className="border border-white/[0.09] bg-[#0B0C0E] p-5 space-y-3 font-mono text-[12px]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#F5F5F3] uppercase tracking-wider">
                ACTIVE ROUTES
              </span>
              <span className="px-2 py-0.5 rounded text-[10.5px] bg-[#070708] border border-white/[0.08] text-[#A0A0A4]">
                {routes.length} active
              </span>
            </div>
            <button
              onClick={fetchRoutes}
              disabled={loadingRoutes}
              className="text-[11.5px] text-[#F5F5F3] hover:text-[#A5F36B] transition-colors font-medium cursor-pointer"
            >
              {loadingRoutes ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {routes.length === 0 ? (
            <div className="text-center py-8 text-[#66686D] text-[12px] border border-dashed border-white/[0.06] bg-[#070708]">
              No active routes. Gateway routes are bound and unbound dynamically via WebMCP.
            </div>
          ) : (
            <div className="overflow-x-auto border border-white/[0.06] bg-[#070708]">
              <table className="w-full text-left text-[11.5px] border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[#66686D] text-[10.5px] uppercase bg-[#070708]">
                    <th className="py-2.5 px-3">Operation key</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Target URL</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-[#A0A0A4]">
                  {routes.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-amber-300 font-mono">
                        {r.operationKey}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-[#F5F5F3]">{r.projectName}</td>
                      <td className="py-2.5 px-3 text-[#A0A0A4] font-mono">{r.targetUrl}</td>
                      <td className="py-2.5 px-3 text-[#A5F36B] font-mono text-[11px]">✓ Active</td>
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
