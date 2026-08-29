"use client";

import { useState, useEffect } from "react";
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

  const fetchRoutes = async () => {
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
  };

  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/routes");
        const data = await res.json();
        if (isMounted && data.routes && Array.isArray(data.routes)) {
          setRoutes(data.routes);
        }
      } catch (err) {
        console.error("Failed to poll routes:", err);
      }
    }, 2000);

    fetch("/api/routes")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.routes && Array.isArray(data.routes)) {
          setRoutes(data.routes);
        }
      })
      .catch((err) => console.error("Initial fetchRoutes error:", err));

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 sm:p-10 selection:bg-accent-lime selection:text-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-white/8 pb-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Routing Service
              </h1>
            </div>
            <p className="text-xs text-muted">
              Gateway routing proxy for WebMCP microservices
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <span className="px-2.5 py-1 rounded bg-panel border border-white/9">
              Port 3001
            </span>
          </div>
        </header>

        {/* WebMCP Registrar Component */}
        <section className="space-y-2">
          <span className="text-xs font-mono text-subtle uppercase tracking-wider block">
            WebMCP STATUS
          </span>
          <WebMCPRegistrar onStatusChange={setStatus} />
        </section>

        {/* Exposed Tools */}
        <section className="border border-white/9 bg-panel p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/6 pb-2 text-xs">
            <span className="font-bold text-foreground uppercase tracking-wider">
              EXPOSED WEBMCP TOOLS ({status.tools.length})
            </span>
            <span className="text-subtle">
              Coordinator: <code className="text-muted">{process.env.NEXT_PUBLIC_MCPX_ORIGIN || "http://localhost:3000"}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {status.tools.map((toolName) => (
              <div
                key={toolName}
                className="flex items-center justify-between p-3 border border-white/6 bg-background"
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 text-xs">✓</span>
                  <code className="text-xs font-mono text-foreground">
                    {toolName}
                  </code>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/6 text-muted">
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
        <section className="border border-white/9 bg-panel p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/6 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                ACTIVE ROUTES
              </span>
              <span className="px-2 py-0.5 rounded text-xs bg-background border border-white/8 text-muted">
                {routes.length} active
              </span>
            </div>
            <button
              onClick={fetchRoutes}
              disabled={loadingRoutes}
              className="text-xs text-foreground hover:text-accent-lime transition-colors font-medium cursor-pointer"
            >
              {loadingRoutes ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {routes.length === 0 ? (
            <div className="text-center py-8 text-subtle text-xs border border-dashed border-white/6 bg-background">
              No active routes. Gateway routes are bound and unbound dynamically via WebMCP.
            </div>
          ) : (
            <div className="overflow-x-auto border border-white/6 bg-background">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/6 text-subtle text-[10.5px] uppercase bg-background">
                    <th className="py-2.5 px-3">Operation key</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Target URL</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4 text-muted">
                  {routes.map((r) => (
                    <tr key={r.id} className="hover:bg-white/2">
                      <td className="py-2.5 px-3 text-amber-300 font-mono">
                        {r.operationKey}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-foreground">{r.projectName}</td>
                      <td className="py-2.5 px-3 text-muted font-mono">{r.targetUrl}</td>
                      <td className="py-2.5 px-3 text-accent-lime font-mono text-xs">✓ Active</td>
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
