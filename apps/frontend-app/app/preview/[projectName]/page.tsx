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
  error?: string;
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

  const routingOrigin = process.env.NEXT_PUBLIC_ROUTING_ORIGIN || "http://localhost:3001";
  const computeOrigin = process.env.NEXT_PUBLIC_COMPUTE_ORIGIN || "http://localhost:3003";
  const mcpxOrigin = process.env.NEXT_PUBLIC_MCPX_ORIGIN || "http://localhost:3000";

  const testBackendConnection = useCallback(async (backendId: string) => {
    try {
      setTestingBackend(true);
      const gatewayRes = await fetch(`${routingOrigin}/r/${projectName}`, {
        cache: "no-store",
      }).catch(() => null);

      if (gatewayRes && gatewayRes.ok) {
        const data = await gatewayRes.json();
        setBackendHealth(data.backendResponse || data);
        return;
      }

      // Fallback direct runtime check
      const directRes = await fetch(`${computeOrigin}/runtime/${backendId}/health`, {
        cache: "no-store",
      });
      const data = await directRes.json();
      setBackendHealth(data);
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-400 font-mono text-sm">
          <span className="h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
          Loading frontend deployment for &apos;{projectName}&apos;...
        </div>
      </div>
    );
  }

  if (notFound || !frontend) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center space-y-4 shadow-2xl">
          <div className="h-12 w-12 rounded-full bg-rose-900/50 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 text-xl font-bold">
            404
          </div>
          <h1 className="text-xl font-bold text-white">Application Not Found</h1>
          <p className="text-xs text-rose-300">
            No active frontend deployment exists for project <code className="font-mono text-white font-bold">&apos;{projectName}&apos;</code>. The resource may not have been created or was compensated/deleted.
          </p>
          <div className="pt-2">
            <Link
              href="http://localhost:3000"
              className="inline-block px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700 transition-colors"
            >
              ← Back to MCPx Coordinator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* App Header */}
        <header className="rounded-2xl border border-violet-500/30 bg-linear-to-b from-violet-950/30 via-slate-900/70 to-slate-900/70 p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/30 text-lg">
                🚀
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {projectName}
                </h1>
                <p className="text-xs text-slate-400">
                  Deployed via MCPx WebMCP 4-Service DAG
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                DEPLOYMENT: LIVE
              </span>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] block">
                Frontend Resource ID
              </span>
              <span className="text-violet-300 font-semibold truncate block">
                {frontend.id}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] block">
                Bound Backend Compute ID
              </span>
              <span className="text-indigo-300 font-semibold truncate block">
                {frontend.backendResourceId}
              </span>
            </div>
          </div>
        </header>

        {/* Backend Connectivity Status */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Live Gateway & Upstream Compute Health
            </h2>
            <button
              onClick={() => testBackendConnection(frontend.backendResourceId)}
              disabled={testingBackend}
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {testingBackend ? (
                <span>Checking...</span>
              ) : (
                <span>[ Check Backend ]</span>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Routing Gateway:</span>
              <a
                href={`${routingOrigin}/r/${projectName}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                {routingOrigin}/r/{projectName} ↗
              </a>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Backend Health Endpoint:</span>
              <a
                href={`${computeOrigin}/runtime/${frontend.backendResourceId}/health`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                {computeOrigin}/runtime/{frontend.backendResourceId.slice(0, 8)}.../health ↗
              </a>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-500">Gateway Upstream Health:</span>
              <span
                className={`font-bold ${backendHealth?.status === "healthy"
                    ? "text-emerald-400"
                    : "text-rose-400"
                  }`}
              >
                {backendHealth?.status === "healthy"
                  ? "✓ 200 OK (HEALTHY)"
                  : backendHealth?.error || "UNAVAILABLE"}
              </span>
            </div>

            {backendHealth?.databaseResourceId && (
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-slate-500">Database Binding:</span>
                <span className="text-emerald-400">
                  {backendHealth.databaseResourceId}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 font-mono">
          <span>Live Preview Deployment</span>
          <Link
            href={mcpxOrigin}
            className="text-violet-400 hover:underline"
          >
            ← MCPx Control Plane
          </Link>
        </div>
      </div>
    </div>
  );
}
