"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/services/AppNav";
import WebMCPServiceFrame from "@/components/services/WebMCPServiceFrame";
import { useConnectedServices } from "@/hooks/useConnectedServices";
import { useReliabilityContracts } from "@/hooks/useReliabilityContracts";
import type { ConnectedServiceRecord } from "@/lib/db";

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { rediscoverService, removeService } = useConnectedServices();
  const { contracts, fetchContracts } = useReliabilityContracts(id);

  const [service, setService] = useState<ConnectedServiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRediscovering, setIsRediscovering] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedSchemaIndex, setExpandedSchemaIndex] = useState<number | null>(null);
  const [rediscoverSuccess, setRediscoverSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/services/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setService(data.service);
      } catch (err: unknown) {
        console.error("[mcpx-detail] load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleRediscover = async () => {
    if (!service) return;
    try {
      setIsRediscovering(true);
      setRediscoverSuccess(false);
      const tools = await rediscoverService(service.id, service.origin);
      setService((prev) =>
        prev
          ? {
              ...prev,
              lastDiscoveredTools: tools,
              lastDiscoveredAt: new Date().toISOString(),
            }
          : null
      );
      await fetchContracts();
      setRediscoverSuccess(true);
      setTimeout(() => setRediscoverSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("[mcpx-detail] rediscover error:", err);
      alert(err instanceof Error ? err.message : "Failed to rediscover tools");
    } finally {
      setIsRediscovering(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    try {
      setIsDeleting(true);
      await removeService(service.id);
      router.push("/app/services");
    } catch (err: unknown) {
      console.error("[mcpx-detail] delete error:", err);
      alert(err instanceof Error ? err.message : "Failed to remove service");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <AppNav />
          <div className="py-12 text-center text-xs text-slate-500">
            Loading service details…
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <AppNav />
          <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 space-y-3">
            <h2 className="font-semibold text-sm">Service not found</h2>
            <p className="text-slate-400">{error || "Could not retrieve connected service."}</p>
            <Link
              href="/app/services"
              className="text-indigo-400 hover:text-indigo-300 font-medium inline-block"
            >
              ← Back to Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        <AppNav />

        {/* Offscreen frame for active Rediscovery */}
        <WebMCPServiceFrame origin={service.origin} />

        {/* Header & Back navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/app/services"
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Services
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                {service.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>{service.origin}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 font-sans">
                Connected {new Date(service.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleRediscover}
              disabled={isRediscovering}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRediscovering ? "Rediscovering…" : "Rediscover tools"}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 text-rose-300 transition-colors cursor-pointer"
            >
              Remove service
            </button>
          </div>
        </div>

        {rediscoverSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 animate-in fade-in duration-200">
            ✓ WebMCP tools refreshed successfully.
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="p-5 rounded-2xl border border-rose-500/40 bg-rose-950/30 space-y-3 animate-in fade-in duration-150">
            <h3 className="text-sm font-semibold text-white">
              Remove this service from MCPx?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This only removes the service metadata from your MCPx registry. This does not change anything in the connected application.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Removing…" : "Confirm removal"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Reliability Contracts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Reliability contracts ({contracts.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configured execute, inspect, and compensation mappings for this service.
              </p>
            </div>

            <Link
              href={`/app/services/${encodeURIComponent(id)}/contracts/new`}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              Create contract
            </Link>
          </div>

          {contracts.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 text-center space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-300 block">
                  No reliability contracts configured
                </span>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Map consequential actions to authoritative inspection and optional compensation before using them in MCPx workflows.
                </p>
              </div>
              <Link
                href={`/app/services/${encodeURIComponent(id)}/contracts/new`}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-block cursor-pointer"
              >
                Create contract
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
              {contracts.map((ctr) => (
                <div
                  key={ctr.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          ctr.status === "READY"
                            ? "bg-emerald-400"
                            : ctr.status === "NEEDS_REVIEW"
                            ? "bg-amber-400"
                            : "bg-rose-400"
                        }`}
                      ></span>
                      <h3 className="text-sm font-semibold text-white font-sans">
                        {ctr.name}
                      </h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          ctr.status === "READY"
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                            : ctr.status === "NEEDS_REVIEW"
                            ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                            : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                        }`}
                      >
                        {ctr.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[11px] text-slate-400">
                      <span className="text-emerald-400">{ctr.executeToolName}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-cyan-400">{ctr.inspectToolName}</span>
                      {ctr.compensateToolName && (
                        <>
                          <span className="text-slate-600">→</span>
                          <span className="text-rose-400">{ctr.compensateToolName}</span>
                        </>
                      )}
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-300 font-sans text-[11px]">
                        Identity: {ctr.operationKeyField}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/app/services/${encodeURIComponent(id)}/contracts/${encodeURIComponent(ctr.id)}`}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    View contract →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Discovered Tools */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Discovered WebMCP tools ({service.lastDiscoveredTools?.length || 0})
            </h2>
            {service.lastDiscoveredAt && (
              <span className="text-[11px] text-slate-500 font-mono">
                Last checked: {new Date(service.lastDiscoveredAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
            {service.lastDiscoveredTools?.map((tool, idx) => (
              <div key={tool.name} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-medium text-emerald-400 block">
                      {tool.name}
                    </span>
                    {tool.description && (
                      <p className="text-xs text-slate-400 font-sans">
                        {tool.description}
                      </p>
                    )}
                  </div>

                  {tool.inputSchema && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSchemaIndex(expandedSchemaIndex === idx ? null : idx)
                      }
                      className="text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {expandedSchemaIndex === idx ? "▾ schema" : "▸ schema"}
                    </button>
                  )}
                </div>

                {expandedSchemaIndex === idx && tool.inputSchema && (
                  <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all">
                    {JSON.stringify(tool.inputSchema, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
