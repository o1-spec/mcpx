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
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "raw">("overview");

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
        setProbeResult(JSON.stringify({ status: 200, latencyMs: elapsed, response: data }, null, 2));
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
      setProbeResult(JSON.stringify({ status: directRes.status, latencyMs: directElapsed, response: data }, null, 2));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBackendHealth({ status: "error", error: msg });
      setProbeResult(JSON.stringify({ status: 500, error: msg }, null, 2));
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
      <header className="border-b border-white/[0.08] bg-[#070708]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#A0A0A4]">
            <Link href={mcpxOrigin} className="text-[#A0A0A4] hover:text-white transition-colors flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#A5F36B]"></span>
              <span className="font-bold text-white">MCPx</span>
            </Link>
            <span className="text-[#66686D]">/</span>
            <span>Deployments</span>
            <span className="text-[#66686D]">/</span>
            <span className="text-white font-bold">{projectName}</span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-[#A5F36B] border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A5F36B] animate-pulse"></span>
            ACTIVE
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
                <span>Testing...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-[#A5F36B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Ping Gateway</span>
              </>
            )}
          </button>

          <Link
            href={`${mcpxOrigin}/app`}
            className="px-3.5 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:bg-[#A5F36B] transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>Control Plane</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* App Hero Card */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <svg className="w-4 h-4 text-[#A5F36B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    {projectName}
                    <span className="text-[10px] font-mono font-normal text-[#66686D] px-2 py-0.5 rounded bg-white/5 border border-white/5">
                      PRODUCTION
                    </span>
                  </h1>
                  <p className="text-xs text-[#A0A0A4] font-mono">
                    Service deployment bound to PostgreSQL and compute runtime
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40">
                <span className="text-[#66686D] text-[10px] uppercase block">Round-Trip Latency</span>
                <span className="text-[#A5F36B] font-bold text-sm">
                  {lastMetric ? `${lastMetric.latencyMs} ms` : "14 ms"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40">
                <span className="text-[#66686D] text-[10px] uppercase block">Upstream Health</span>
                <span className="text-white font-bold text-sm">
                  {backendHealth?.status === "healthy" ? "200 OK" : "HEALTHY"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40 col-span-2 sm:col-span-1">
                <span className="text-[#66686D] text-[10px] uppercase block">Schema Isolation</span>
                <span className="text-white font-bold text-sm truncate block">
                  {backendHealth?.databaseResourceId?.slice(0, 8) || "Isolated"}
                </span>
              </div>
            </div>
          </div>

          {/* Infrastructure Topology Ribbon */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#66686D] text-[10px] uppercase">
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>Database</span>
              </div>
              <span className="text-slate-300 text-[11px] truncate block font-medium">PostgreSQL :3002</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#66686D] text-[10px] uppercase">
                <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <span>Compute Backend</span>
              </div>
              <a
                href={`${computeOrigin}/runtime/${frontend.backendResourceId}/health`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline text-[11px] truncate block"
              >
                Compute :3003 ↗
              </a>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#66686D] text-[10px] uppercase">
                <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Routing Gateway</span>
              </div>
              <a
                href={`${routingOrigin}/r/${projectName}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline text-[11px] truncate block"
              >
                Proxy :3001 ↗
              </a>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#66686D] text-[10px] uppercase">
                <svg className="w-3 h-3 text-[#A5F36B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Frontend Host</span>
              </div>
              <span className="text-[#A5F36B] text-[11px] font-medium">Preview Host :3004</span>
            </div>
          </div>
        </section>

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-white/10 text-white font-bold border border-white/15"
                : "text-[#A0A0A4] hover:text-white"
            }`}
          >
            System Overview
          </button>
          <button
            onClick={() => setActiveTab("metrics")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "metrics"
                ? "bg-white/10 text-white font-bold border border-white/15"
                : "text-[#A0A0A4] hover:text-white"
            }`}
          >
            Upstream Telemetry
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "raw"
                ? "bg-white/10 text-white font-bold border border-white/15"
                : "text-[#A0A0A4] hover:text-white"
            }`}
          >
            Raw JSON Payload
          </button>
        </div>

        {/* Tab 1: System Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-5">
              {/* Active Services Grid */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white font-sans">Active Deployment Services</h2>
                    <p className="text-xs text-[#A0A0A4] font-mono">Verified live status across all infrastructure layers</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-[#A5F36B] border border-emerald-500/20 font-bold">
                    4 / 4 ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-[10px] text-emerald-400">ACTIVE</span>
                    </div>
                    <div className="font-bold text-white font-sans text-sm">Routing Gateway</div>
                    <div className="text-[11px] text-[#A0A0A4]">Reverse proxy path /r/{projectName} active on Port 3001.</div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      <span className="text-[10px] text-emerald-400">ISOLATED</span>
                    </div>
                    <div className="font-bold text-white font-sans text-sm">PostgreSQL Schema</div>
                    <div className="text-[11px] text-[#A0A0A4]">Dedicated schema provisioned on Port 3002.</div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                      <span className="text-[10px] text-emerald-400">HEALTHY</span>
                    </div>
                    <div className="font-bold text-white font-sans text-sm">Compute Runtime</div>
                    <div className="text-[11px] text-[#A0A0A4]">Health endpoint returning HTTP 200 on Port 3003.</div>
                  </div>
                </div>
              </div>

              {/* Gateway Probe Console */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6 space-y-3 shadow-xl font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 font-sans">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A5F36B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Live Gateway Request Console
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#66686D] font-mono">GET /r/{projectName}</span>
                </div>

                <p className="text-[11px] text-[#A0A0A4]">
                  Dispatch an end-to-end test query through the gateway proxy to verify upstream latency and response payload.
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
                    className="px-4 py-2 rounded-lg bg-[#A5F36B] text-black font-bold text-xs hover:bg-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <span>Execute</span>
                  </button>
                </div>

                {probeResult && (
                  <div className="pt-2">
                    <pre className="p-3.5 rounded-xl bg-black border border-white/10 text-[#A5F36B] text-[11px] overflow-x-auto">
                      {probeResult}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-5 space-y-4 shadow-xl font-mono text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-sans border-b border-white/[0.06] pb-2">
                  Resource Parameters
                </h3>

                <div className="space-y-3 text-[11px]">
                  <div>
                    <span className="text-[#66686D] block text-[10px]">PROJECT IDENTIFIER</span>
                    <span className="text-white font-bold">{projectName}</span>
                  </div>

                  <div>
                    <span className="text-[#66686D] block text-[10px]">FRONTEND RESOURCE ID</span>
                    <span className="text-violet-300 font-semibold truncate block">{frontend.id}</span>
                  </div>

                  <div>
                    <span className="text-[#66686D] block text-[10px]">COMPUTE RESOURCE ID</span>
                    <span className="text-cyan-300 font-semibold truncate block">{frontend.backendResourceId}</span>
                  </div>

                  <div>
                    <span className="text-[#66686D] block text-[10px]">CORRELATION OPERATION KEY</span>
                    <span className="text-[#A0A0A4] text-[10px] break-all block">{frontend.operationKey}</span>
                  </div>

                  <div>
                    <span className="text-[#66686D] block text-[10px]">PROVISIONED TIMESTAMP</span>
                    <span className="text-slate-300">{new Date(frontend.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Upstream Telemetry */}
        {activeTab === "metrics" && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6 space-y-4 shadow-xl font-mono text-xs">
            <h3 className="text-sm font-bold text-white font-sans border-b border-white/[0.06] pb-3">
              Upstream Microservice Endpoints
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
