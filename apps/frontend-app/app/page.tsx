"use client";

import { useState, useEffect } from "react";
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

  const fetchFrontends = async () => {
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
  };

  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/frontends");
        const data = await res.json();
        if (isMounted && data.frontends && Array.isArray(data.frontends)) {
          setFrontends(data.frontends);
        }
      } catch (err) {
        console.error("Failed to poll frontends:", err);
      }
    }, 2000);

    fetch("/api/frontends")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.frontends && Array.isArray(data.frontends)) {
          setFrontends(data.frontends);
        }
      })
      .catch((err) => console.error("Initial fetchFrontends error:", err));

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
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Frontend CDN &amp; Distribution Runtime
              </h1>
            </div>
            <p className="text-xs text-subtle font-mono">
              Port :3004 • Edge CDN &amp; Static Site Hosting
            </p>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-mono border border-white/8 bg-panel text-muted uppercase">
            Service Active
          </span>
        </header>

        {/* WebMCP Status */}
        <WebMCPRegistrar onStatusChange={setStatus} />

        {/* Deployments Section */}
        <section className="bg-panel border border-white/8 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Active Previews</h2>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-white/4 text-muted border border-white/6">
                {frontends.length}
              </span>
            </div>
          </div>

          {databasesPlaceholder(frontends)}
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
                  <span className="text-violet-400 text-xs">✓</span>
                  <code className="text-xs font-mono text-foreground">
                    {toolName}
                  </code>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/6 text-muted">
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

        {/* Active Frontends */}
        <section className="border border-white/9 bg-panel p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/6 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                ACTIVE FRONTEND PREVIEWS
              </span>
              <span className="px-2 py-0.5 rounded text-xs bg-background border border-white/8 text-muted">
                {frontends.length} active
              </span>
            </div>
            <button
              onClick={fetchFrontends}
              disabled={loading}
              className="text-xs text-foreground hover:text-accent-lime transition-colors font-medium cursor-pointer"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {databasesPlaceholder(frontends)}
        </section>
      </div>
    </div>
  );
}

function databasesPlaceholder(frontends: FrontendRecord[]) {
  if (frontends.length === 0) {
    return (
      <div className="text-center py-8 text-subtle text-xs border border-dashed border-white/6 bg-background">
        No active frontend previews. Deployments are provisioned and torn down dynamically via WebMCP.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-white/6 bg-background">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/6 text-subtle text-[10.5px] uppercase bg-background">
            <th className="py-2.5 px-3">Operation key</th>
            <th className="py-2.5 px-3">Project name</th>
            <th className="py-2.5 px-3">Preview URL</th>
            <th className="py-2.5 px-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/4 text-muted">
          {frontends.map((f) => (
            <tr key={f.id} className="hover:bg-white/2">
              <td className="py-2.5 px-3 text-amber-300 font-mono">
                {f.operationKey}
              </td>
              <td className="py-2.5 px-3 font-sans font-medium text-foreground">{f.projectName}</td>
              <td className="py-2.5 px-3 text-muted font-mono">{f.previewUrl}</td>
              <td className="py-2.5 px-3 text-accent-lime font-mono text-xs">✓ Active</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
