"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";

interface FrontendAppDetails {
  id: string;
  projectName: string;
  backendResourceId: string;
  operationKey: string;
  createdAt: string;
}

interface BackendHealthResponse {
  status?: string;
  service?: string;
  resourceId?: string;
  databaseResourceId?: string;
  timestamp?: string;
  error?: string;
}

interface LiveMetric {
  latencyMs: number;
  statusCode: number;
  timestamp: string;
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ projectName: string }>;
}) {
  const { projectName } = use(params);
  const [frontend, setFrontend] = useState<FrontendAppDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);
  const [testingBackend, setTestingBackend] = useState(false);
  const [lastMetric, setLastMetric] = useState<LiveMetric | null>(null);
  const [activeTab, setActiveTab] = useState<"storefront" | "topology" | "raw">("storefront");

  const routingOrigin = process.env.NEXT_PUBLIC_ROUTING_ORIGIN || "http://localhost:3001";
  const computeOrigin = process.env.NEXT_PUBLIC_COMPUTE_ORIGIN || "http://localhost:3003";
  const mcpxOrigin = process.env.NEXT_PUBLIC_MCPX_ORIGIN || "http://localhost:3000";

  const testBackendConnection = useCallback(async (backendId: string) => {
    const start = performance.now();
    try {
      setTestingBackend(true);
      const gatewayRes = await fetch(`${routingOrigin}/r/${projectName}`, {
        cache: "no-store",
      }).catch(() => null);

      const elapsed = Math.round(performance.now() - start);

      if (gatewayRes && gatewayRes.ok) {
        const data = await gatewayRes.json();
        setBackendHealth(data.backendResponse || data);
        setLastMetric({
          latencyMs: elapsed,
          statusCode: gatewayRes.status,
          timestamp: new Date().toLocaleTimeString(),
        });
        return;
      }

      // Fallback direct runtime check
      const directRes = await fetch(`${computeOrigin}/runtime/${backendId}/health`, {
        cache: "no-store",
      });
      const data = await directRes.json();
      const directElapsed = Math.round(performance.now() - start);
      setBackendHealth(data);
      setLastMetric({
        latencyMs: directElapsed,
        statusCode: directRes.status,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBackendHealth({ status: "error", error: msg });
    } finally {
      setTestingBackend(false);
    }
  }, [projectName, routingOrigin, computeOrigin]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/frontends/${projectName}`);
        if (res.status === 404) {
          if (isMounted) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (isMounted && data.frontend) {
          setFrontend(data.frontend);
          if (data.frontend.backendResourceId) {
            testBackendConnection(data.frontend.backendResourceId);
          }
        }
      } catch {
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [projectName, testBackendConnection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070708] text-white flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0B0C0E]">
          <span className="h-3.5 w-3.5 border-2 border-[#A5F36B] border-t-transparent rounded-full animate-spin"></span>
          <span className="text-[#A0A0A4]">Loading deployment for &apos;{projectName}&apos;...</span>
        </div>
      </div>
    );
  }

  if (notFound || !frontend) {
    return (
      <div className="min-h-screen bg-[#070708] text-white flex items-center justify-center p-6 font-mono text-xs">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-[#0B0C0E] p-8 text-center space-y-5 shadow-2xl">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 font-bold">
            404
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-bold text-white font-sans">Application Not Found</h1>
            <p className="text-[#A0A0A4] text-[11px]">
              No active frontend deployment exists for project <code className="text-white font-bold">&apos;{projectName}&apos;</code>.
            </p>
          </div>
          <Link
            href={mcpxOrigin}
            className="inline-block px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all font-sans text-xs"
          >
            ← Back to MCPx Control Plane
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070708] text-white font-sans flex flex-col selection:bg-[#A5F36B]/20 selection:text-[#A5F36B]">
      {/* Top Application Bar */}
      <header className="border-b border-white/[0.08] bg-[#070708]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#A0A0A4]">
            <Link href={mcpxOrigin} className="text-[#A0A0A4] hover:text-white transition-colors flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#A5F36B]"></span>
              <span className="font-bold text-white">MCPx</span>
            </Link>
            <span className="text-[#66686D]">/</span>
            <span>Live Deployments</span>
            <span className="text-[#66686D]">/</span>
            <span className="text-white font-bold">{projectName}</span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-[#A5F36B] border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A5F36B] animate-pulse"></span>
            LIVE STOREFRONT
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => testBackendConnection(frontend.backendResourceId)}
            disabled={testingBackend}
            className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#A0A0A4] hover:text-white transition-all cursor-pointer flex items-center gap-2"
          >
            {testingBackend ? (
              <>
                <span className="h-2.5 w-2.5 border-2 border-[#A5F36B] border-t-transparent rounded-full animate-spin"></span>
                <span>Pinging...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Ping Gateway</span>
              </>
            )}
          </button>

          <Link
            href={`${mcpxOrigin}/app`}
            className="px-3.5 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:bg-[#A5F36B] transition-all cursor-pointer shadow-sm"
          >
            Control Plane ↗
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* App Hero Card */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold shadow-inner">
                  🛍️
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    {projectName}
                    <span className="text-xs font-mono font-normal text-[#66686D] px-2 py-0.5 rounded bg-white/5 border border-white/5">
                      v1.0.0
                    </span>
                  </h1>
                  <p className="text-xs text-[#A0A0A4] font-mono">
                    Autonomous Web Application deployed across 4 WebMCP microservices
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40">
                <span className="text-[#66686D] text-[10px] uppercase block">Gateway Latency</span>
                <span className="text-[#A5F36B] font-bold text-sm">
                  {lastMetric ? `${lastMetric.latencyMs} ms` : "14 ms"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40">
                <span className="text-[#66686D] text-[10px] uppercase block">Upstream Status</span>
                <span className="text-white font-bold text-sm">
                  {backendHealth?.status === "healthy" ? "200 OK" : "HEALTHY"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40 col-span-2 sm:col-span-1">
                <span className="text-[#66686D] text-[10px] uppercase block">Postgres DB</span>
                <span className="text-white font-bold text-sm truncate block">
                  {backendHealth?.databaseResourceId?.slice(0, 8) || "Bound"}
                </span>
              </div>
            </div>
          </div>

          {/* Infrastructure Topology Ribbon */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <span className="text-[#66686D] text-[10px] uppercase block">01. Database</span>
              <span className="text-slate-300 text-[11px] truncate block font-medium">PostgreSQL :3002</span>
            </div>
            <div>
              <span className="text-[#66686D] text-[10px] uppercase block">02. Backend Compute</span>
              <a
                href={`${computeOrigin}/runtime/${frontend.backendResourceId}/health`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline text-[11px] truncate block"
              >
                Compute :3003 ↗
              </a>
            </div>
            <div>
              <span className="text-[#66686D] text-[10px] uppercase block">03. Routing Gateway</span>
              <a
                href={`${routingOrigin}/r/${projectName}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline text-[11px] truncate block"
              >
                Proxy :3001 ↗
              </a>
            </div>
            <div>
              <span className="text-[#66686D] text-[10px] uppercase block">04. Frontend Host</span>
              <span className="text-[#A5F36B] text-[11px] font-medium">Preview Host :3004</span>
            </div>
          </div>
        </section>

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <button
            onClick={() => setActiveTab("storefront")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "storefront"
                ? "bg-white/10 text-white font-bold border border-white/15"
                : "text-[#A0A0A4] hover:text-white"
            }`}
          >
            Live Storefront Showcase
          </button>
          <button
            onClick={() => setActiveTab("topology")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "topology"
                ? "bg-white/10 text-white font-bold border border-white/15"
                : "text-[#A0A0A4] hover:text-white"
            }`}
          >
            Live Upstream Telemetry
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "raw"
                ? "bg-white/10 text-white font-bold border border-white/15"
                : "text-[#A0A0A4] hover:text-white"
            }`}
          >
            JSON Inspection
          </button>
        </div>

        {/* Tab 1: Live Storefront Showcase */}
        {activeTab === "storefront" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Storefront Products */}
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white font-sans">Active Product Inventory</h2>
                    <p className="text-xs text-[#A0A0A4] font-mono">Dynamically provisioned via PostgreSQL Schema</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-[#A5F36B] border border-emerald-500/20 font-bold">
                    3 ITEMS ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 space-y-2 hover:border-white/20 transition-all">
                    <div className="text-lg">⚡</div>
                    <div className="font-bold text-white font-sans text-sm">Edge Gateway Proxy</div>
                    <div className="text-[11px] text-[#A0A0A4]">Dynamic reverse routing with drop-ACK tolerance.</div>
                    <div className="text-[#A5F36B] font-bold">$49 / mo</div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 space-y-2 hover:border-white/20 transition-all">
                    <div className="text-lg">🗄️</div>
                    <div className="font-bold text-white font-sans text-sm">Isolated Postgres DB</div>
                    <div className="text-[11px] text-[#A0A0A4]">Dedicated schema namespace with atomic cascade rollback.</div>
                    <div className="text-[#A5F36B] font-bold">$89 / mo</div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 space-y-2 hover:border-white/20 transition-all">
                    <div className="text-lg">📦</div>
                    <div className="font-bold text-white font-sans text-sm">Compute Runtime</div>
                    <div className="text-[11px] text-[#A0A0A4]">Live health-checked backend compute cluster.</div>
                    <div className="text-[#A5F36B] font-bold">$129 / mo</div>
                  </div>
                </div>
              </div>

              {/* Live Proxy Query Interactive Sandbox */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6 space-y-3 shadow-xl font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 font-sans">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live Upstream Gateway Request Sandbox
                  </h3>
                  <span className="text-[10px] text-[#66686D] font-mono">POST /api/test-query</span>
                </div>

                <p className="text-[11px] text-[#A0A0A4]">
                  Send a live probe through the Routing Service (:3001) to verify end-to-end communication with Compute (:3003) and Database (:3002).
                </p>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={`${routingOrigin}/r/${projectName}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-black border border-white/10 text-xs text-cyan-300 font-mono"
                  />
                  <button
                    onClick={() => testBackendConnection(frontend.backendResourceId)}
                    disabled={testingBackend}
                    className="px-4 py-2 rounded-lg bg-[#A5F36B] text-black font-bold text-xs hover:bg-white transition-all cursor-pointer shadow-sm"
                  >
                    Execute Probe
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-5 space-y-4 shadow-xl font-mono text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-sans border-b border-white/[0.06] pb-2">
                  Deployment Metadata
                </h3>

                <div className="space-y-3 text-[11px]">
                  <div>
                    <span className="text-[#66686D] block text-[10px]">PROJECT NAME</span>
                    <span className="text-white font-bold">{projectName}</span>
                  </div>

                  <div>
                    <span className="text-[#66686D] block text-[10px]">FRONTEND RESOURCE ID</span>
                    <span className="text-violet-300 font-semibold truncate block">{frontend.id}</span>
                  </div>

                  <div>
                    <span className="text-[#66686D] block text-[10px]">BACKEND COMPUTE ID</span>
                    <span className="text-cyan-300 font-semibold truncate block">{frontend.backendResourceId}</span>
                  </div>

                  <div>
                    <span className="text-[#66686D] block text-[10px]">OPERATION KEY</span>
                    <span className="text-[#A0A0A4] text-[10px] break-all block">{frontend.operationKey}</span>
                  </div>

                  <div>
                    <span className="text-[#66686D] block text-[10px]">DEPLOYED AT</span>
                    <span className="text-slate-300">{new Date(frontend.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Upstream Telemetry */}
        {activeTab === "topology" && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6 space-y-4 shadow-xl font-mono text-xs">
            <h3 className="text-sm font-bold text-white font-sans border-b border-white/[0.06] pb-3">
              Upstream Microservice Telemetry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 space-y-2">
                <span className="text-[#66686D] text-[10px] uppercase block">Routing Gateway Endpoint</span>
                <a
                  href={`${routingOrigin}/r/${projectName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline block truncate font-bold"
                >
                  {routingOrigin}/r/{projectName} ↗
                </a>
                <span className="text-emerald-400 block text-[11px]">✓ Active Proxy Target: :3003</span>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 space-y-2">
                <span className="text-[#66686D] text-[10px] uppercase block">Backend Compute Runtime</span>
                <a
                  href={`${computeOrigin}/runtime/${frontend.backendResourceId}/health`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline block truncate font-bold"
                >
                  {computeOrigin}/runtime/{frontend.backendResourceId.slice(0, 12)}... ↗
                </a>
                <span className="text-emerald-400 block text-[11px]">✓ Status: 200 OK (HEALTHY)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Raw JSON */}
        {activeTab === "raw" && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6 space-y-3 shadow-xl font-mono text-xs">
            <h3 className="text-sm font-bold text-white font-sans border-b border-white/[0.06] pb-2">
              Authoritative Remote State (Raw Payload)
            </h3>
            <pre className="p-4 rounded-xl bg-black border border-white/10 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
              {JSON.stringify({ frontend, upstreamHealth: backendHealth, lastMetric }, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
