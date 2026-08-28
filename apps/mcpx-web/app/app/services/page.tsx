"use client";

import Link from "next/link";
import AppNav from "@/components/services/AppNav";
import { useConnectedServices } from "@/hooks/useConnectedServices";

const referenceServices = [
  {
    name: "Database Service",
    origin: "http://localhost:3002",
    tools: ["create_database", "get_database", "delete_database"],
    role: "PostgreSQL schema resource plane",
  },
  {
    name: "Compute Service",
    origin: "http://localhost:3003",
    tools: ["deploy_backend", "get_backend", "delete_backend"],
    role: "Backend runtime health provider",
  },
  {
    name: "Routing Service",
    origin: "http://localhost:3001",
    tools: ["create_route", "get_route", "delete_route"],
    role: "Gateway proxy route manager",
  },
  {
    name: "Frontend Service",
    origin: "http://localhost:3004",
    tools: ["deploy_frontend", "get_frontend", "delete_frontend"],
    role: "Application preview host",
  },
];

export default function ServicesPage() {
  const { services, loading } = useConnectedServices();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <AppNav />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Services
            </h1>
            <p className="text-xs text-slate-400">
              Connect WebMCP applications that MCPx can use in reliable workflows.
            </p>
          </div>

          <Link
            href="/app/services/new"
            className="px-4 py-2 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            Connect service
          </Link>
        </div>

        {/* Section A: Your Services */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Your services ({services.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Loading connected services…
            </div>
          ) : services.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-3 bg-slate-900/10">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-300 block">
                  No WebMCP services connected yet
                </span>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Connect any application that exposes tools to MCPx via the browser-native WebMCP standard.
                </p>
              </div>

              <div className="pt-1">
                <Link
                  href="/app/services/new"
                  className="px-4 py-2 rounded-lg font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-block cursor-pointer"
                >
                  Connect service
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800/80 bg-slate-900/20 overflow-hidden">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <h3 className="text-sm font-semibold text-white font-sans">
                        {srv.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono text-[11px]">
                      <span>{srv.origin}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300 font-sans">
                        {srv.lastDiscoveredTools?.length || 0} tools discovered
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500 font-sans">
                        Contract not configured
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/app/services/${srv.id}`}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    View details →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section B: Reference Services */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Reference services
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Included with MCPx to demonstrate multi-origin DAG execution and recovery.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              4 sample apps
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {referenceServices.map((ref) => (
              <div
                key={ref.origin}
                className="p-4 rounded-xl border border-slate-800/70 bg-slate-900/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    <h3 className="text-xs font-semibold text-white">
                      {ref.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {ref.origin}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  {ref.role}
                </p>

                <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-mono">
                    {ref.tools.join(", ")}
                  </span>
                  <span className="text-slate-400 font-sans">
                    Included reference
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
