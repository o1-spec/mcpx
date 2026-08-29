"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [expandedToolIndex, setExpandedToolIndex] = useState<number | null>(null);
  const [rawSchemaToolIndex, setRawSchemaToolIndex] = useState<number | null>(null);
  const [rediscoverSuccess, setRediscoverSuccess] = useState(false);
  const [toolSearch, setToolSearch] = useState("");
  const [showDevDetails, setShowDevDetails] = useState(false);

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

  // Tool search filter
  const tools = service?.lastDiscoveredTools || [];
  const filteredTools = useMemo(() => {
    if (!toolSearch.trim()) return tools;
    const query = toolSearch.toLowerCase().trim();
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
  }, [tools, toolSearch]);

  // Map tool usage in contracts
  const toolUsageMap = useMemo(() => {
    const map = new Map<string, { contractName: string; role: "EXECUTE" | "INSPECT" | "COMPENSATE" }[]>();
    for (const ctr of contracts) {
      if (ctr.executeToolName) {
        const list = map.get(ctr.executeToolName) || [];
        list.push({ contractName: ctr.name, role: "EXECUTE" });
        map.set(ctr.executeToolName, list);
      }
      if (ctr.inspectToolName) {
        const list = map.get(ctr.inspectToolName) || [];
        list.push({ contractName: ctr.name, role: "INSPECT" });
        map.set(ctr.inspectToolName, list);
      }
      if (ctr.compensateToolName) {
        const list = map.get(ctr.compensateToolName) || [];
        list.push({ contractName: ctr.name, role: "COMPENSATE" });
        map.set(ctr.compensateToolName, list);
      }
    }
    return map;
  }, [contracts]);

  const readyContractsCount = contracts.filter((c) => c.status === "READY").length;
  const reviewContractsCount = contracts.filter((c) => c.status !== "READY").length;

  const isReferenceService = useMemo(() => {
    if (!service) return false;
    const n = service.name.toLowerCase();
    const o = service.origin.toLowerCase();
    return (
      n.includes("database") ||
      n.includes("compute") ||
      n.includes("backend") ||
      n.includes("routing") ||
      n.includes("frontend") ||
      o.includes("3001") ||
      o.includes("3002") ||
      o.includes("3003") ||
      o.includes("3004")
    );
  }, [service]);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-[#66686D] space-y-2">
        <div className="w-4 h-4 border-2 border-white/20 border-t-[#A5F36B] rounded-full animate-spin mx-auto"></div>
        <div>Loading service metadata…</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="p-6 border border-rose-500/30 bg-[#0B0C0E] font-mono text-xs text-rose-300 space-y-3">
        <h2 className="font-semibold text-sm text-rose-400">[ SERVICE NOT FOUND ]</h2>
        <p className="text-[#A0A0A4]">{error || "Could not retrieve connected service record."}</p>
        <Link
          href="/app/services"
          className="text-[#F5F5F3] hover:text-white font-medium inline-block underline pt-1"
        >
          ← Back to Services registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Offscreen frame for active Rediscovery */}
      <WebMCPServiceFrame origin={service.origin} />

      {/* ============================================================ */}
      {/* 1. TOP HEADER & HORIZONTAL METADATA BAR */}
      {/* ============================================================ */}
      <div className="space-y-3 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 text-[12px] font-mono text-[#66686D]">
          <Link href="/app/services" className="hover:text-[#F5F5F3] transition-colors">
            Services
          </Link>
          <span>/</span>
          <span className="text-[#A0A0A4]">{service.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[22px] sm:text-[24px] font-bold text-[#F5F5F3] tracking-tight font-sans">
              {service.name}
            </h1>

            {/* Clean Single Horizontal Metadata Line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-mono text-[#A0A0A4]">
              <span className="text-[#F5F5F3]">{service.origin}</span>
              <span className="text-[#66686D]">·</span>
              <span>{service.lastDiscoveredTools?.length || 0} WebMCP tools</span>
              <span className="text-[#66686D]">·</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
              {service.lastDiscoveredAt && (
                <>
                  <span className="text-[#66686D]">·</span>
                  <span className="text-[#66686D]">
                    Discovered {new Date(service.lastDiscoveredAt).toLocaleTimeString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleRediscover}
              disabled={isRediscovering}
              className="px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-[#F5F5F3] font-mono text-[12px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isRediscovering ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Rediscovering…</span>
                </>
              ) : (
                <span>Refresh tools</span>
              )}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded bg-transparent hover:bg-rose-950/30 border border-white/[0.08] hover:border-rose-500/40 text-[#66686D] hover:text-rose-400 font-mono text-[12px] transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {rediscoverSuccess && (
        <div className="p-3 border border-emerald-500/40 bg-emerald-950/20 font-mono text-[12px] text-emerald-300 animate-in fade-in duration-200">
          ✓ WebMCP tool registry successfully refreshed from origin.
        </div>
      )}

      {/* Delete Confirmation Card */}
      {showDeleteConfirm && (
        <div className="p-5 border border-rose-500/40 bg-[#0F1012] font-mono text-[12px] space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <span>[ DISCONNECT SERVICE ]</span>
          </div>
          <p className="text-[#A0A0A4] font-sans text-[13px] leading-relaxed">
            This removes the service and its contract mappings from your MCPx control plane. It does not alter the target WebMCP application runtime.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[12px] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Disconnecting…" : "Confirm disconnect"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 rounded bg-white/[0.04] text-[#A0A0A4] hover:text-[#F5F5F3] border border-white/[0.09] transition-colors cursor-pointer text-[12px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MAIN 2-COLUMN CONTROL PLANE LAYOUT */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT / MAIN COLUMN (~68%) */}
        <div className="lg:col-span-8 space-y-8">
          {/* ============================================================ */}
          {/* SECTION A: DISCOVERED TOOLS REGISTRY */}
          {/* ============================================================ */}
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
              <div>
                <h2 className="text-[13px] font-mono font-bold text-[#F5F5F3] uppercase tracking-wider">
                  Discovered WebMCP Tools ({tools.length})
                </h2>
                <p className="text-[12px] text-[#66686D] mt-0.5 font-sans">
                  Tools currently exposed by this origin over postMessage JSON-RPC.
                </p>
              </div>

              {/* Lightweight Tool Search Filter */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tools…"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="px-2.5 py-1 rounded bg-[#0B0C0E] border border-white/[0.09] text-[#F5F5F3] placeholder-[#66686D] font-mono text-[11.5px] focus:outline-none focus:border-white/30 w-full sm:w-44"
                />
              </div>
            </div>

            {filteredTools.length === 0 ? (
              <div className="p-6 border border-dashed border-white/[0.08] bg-[#0B0C0E] text-center text-[#66686D] font-mono text-[12px]">
                {tools.length === 0 ? "No WebMCP tools discovered on this service." : "No tools matching your search."}
              </div>
            ) : (
              <div className="border border-white/[0.09] bg-[#0B0C0E] divide-y divide-white/[0.06] font-mono text-[12px] overflow-hidden">
                {/* Table Header (Desktop) */}
                <div className="hidden sm:grid sm:grid-cols-12 px-4 py-2 text-[10.5px] text-[#66686D] uppercase tracking-wider bg-[#070708]">
                  <div className="col-span-4">Tool</div>
                  <div className="col-span-2">Intent / Type</div>
                  <div className="col-span-2">Inputs</div>
                  <div className="col-span-3">Contract Mapping</div>
                  <div className="col-span-1 text-right">Inspect</div>
                </div>

                {/* Table Rows */}
                {filteredTools.map((tool, idx) => {
                  const isExpanded = expandedToolIndex === idx;
                  const showRaw = rawSchemaToolIndex === idx;
                  const usages = toolUsageMap.get(tool.name) || [];
                  const props = (tool.inputSchema?.properties as Record<string, { type?: string; description?: string }>) || {};
                  const propKeys = Object.keys(props);
                  const requiredList = Array.isArray(tool.inputSchema?.required) ? (tool.inputSchema.required as string[]) : [];

                  // Infer generic intent
                  let intent = "Tool";
                  if (usages.length > 0) {
                    const role = usages[0].role;
                    intent = role === "EXECUTE" ? "Mutation" : role === "INSPECT" ? "Inspection" : "Compensate";
                  } else if (tool.name.startsWith("get_") || tool.name.startsWith("query_") || tool.name.startsWith("read_") || tool.name.startsWith("inspect_")) {
                    intent = "Inspection";
                  } else if (tool.name.startsWith("create_") || tool.name.startsWith("deploy_") || tool.name.startsWith("provision_") || tool.name.startsWith("delete_") || tool.name.startsWith("update_")) {
                    intent = "Mutation";
                  }

                  return (
                    <div key={tool.name} className="transition-colors hover:bg-white/[0.015]">
                      {/* Main Row */}
                      <div
                        onClick={() => setExpandedToolIndex(isExpanded ? null : idx)}
                        className="p-3.5 sm:px-4 sm:py-2.5 grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-0 cursor-pointer"
                      >
                        <div className="sm:col-span-4 font-bold text-[#F5F5F3] flex items-center gap-1.5">
                          <span className="text-[#A5F36B]">›</span>
                          <span>{tool.name}</span>
                        </div>

                        <div className="sm:col-span-2 text-[#A0A0A4] text-[11.5px] font-sans">
                          {intent}
                        </div>

                        <div className="sm:col-span-2 text-[#66686D] text-[11.5px]">
                          {propKeys.length} {propKeys.length === 1 ? "field" : "fields"}
                        </div>

                        <div className="sm:col-span-3 text-[11.5px]">
                          {usages.length > 0 ? (
                            <span className="text-emerald-400 font-sans">
                              Mapped: {usages[0].contractName}
                            </span>
                          ) : (
                            <span className="text-[#66686D]">—</span>
                          )}
                        </div>

                        <div className="sm:col-span-1 text-right text-[11px] text-[#A0A0A4] hover:text-white">
                          {isExpanded ? "▾ Hide" : "▸ Inspect"}
                        </div>
                      </div>

                      {/* Expanded Inline Detail Drawer */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 bg-[#070708] border-t border-white/[0.06] space-y-4 font-sans text-[12px] animate-in fade-in duration-100">
                          {tool.description && (
                            <div className="space-y-1">
                              <span className="text-[11px] font-mono text-[#66686D] uppercase block">Description</span>
                              <p className="text-[#A0A0A4] leading-relaxed">{tool.description}</p>
                            </div>
                          )}

                          {/* Inputs Table */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-mono text-[#66686D] uppercase block">
                              Input Schema ({propKeys.length} parameters)
                            </span>
                            {propKeys.length === 0 ? (
                              <div className="text-[11.5px] text-[#66686D] font-mono">No input parameters required.</div>
                            ) : (
                              <div className="border border-white/[0.08] bg-[#0B0C0E] divide-y divide-white/[0.04] font-mono text-[11px]">
                                <div className="grid grid-cols-12 px-3 py-1.5 text-[#66686D] text-[10px] uppercase bg-[#070708]">
                                  <div className="col-span-4">Field</div>
                                  <div className="col-span-3">Type</div>
                                  <div className="col-span-5">Requirement</div>
                                </div>
                                {propKeys.map((k) => {
                                  const prop = props[k];
                                  const isReq = requiredList.includes(k);
                                  return (
                                    <div key={k} className="grid grid-cols-12 px-3 py-1.5 items-center">
                                      <div className="col-span-4 font-bold text-[#F5F5F3]">{k}</div>
                                      <div className="col-span-3 text-cyan-300">{prop?.type || "any"}</div>
                                      <div className="col-span-5">
                                        <span className={`px-1.5 py-0.5 rounded text-[9.5px] ${isReq ? "bg-amber-950/60 text-amber-300 border border-amber-500/30" : "text-[#66686D]"}`}>
                                          {isReq ? "required" : "optional"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Contract Usage */}
                          <div className="space-y-1 font-mono text-[11.5px]">
                            <span className="text-[11px] text-[#66686D] uppercase block font-mono">Contract Bindings</span>
                            {usages.length === 0 ? (
                              <span className="text-[#66686D]">Not currently mapped to any reliability contract.</span>
                            ) : (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {usages.map((u, i) => (
                                  <span key={i} className="px-2 py-1 rounded bg-[#0B0C0E] border border-white/[0.08] text-[#F5F5F3]">
                                    {u.contractName} · <span className="text-[#A5F36B]">{u.role}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Raw Schema Toggle */}
                          <div className="pt-2 border-t border-white/[0.04]">
                            <button
                              type="button"
                              onClick={() => setRawSchemaToolIndex(showRaw ? null : idx)}
                              className="text-[11px] font-mono text-[#66686D] hover:text-[#A0A0A4] transition-colors cursor-pointer"
                            >
                              {showRaw ? "▾ Hide raw JSON schema" : "▸ View raw JSON schema"}
                            </button>
                            {showRaw && tool.inputSchema && (
                              <pre className="mt-2 p-3 bg-[#0B0C0E] border border-white/[0.06] font-mono text-[10.5px] text-[#A0A0A4] whitespace-pre-wrap break-all overflow-x-auto">
                                {JSON.stringify(tool.inputSchema, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ============================================================ */}
          {/* SECTION B: RELIABILITY CONTRACTS REGISTRY */}
          {/* ============================================================ */}
          <section className="space-y-3 pt-4 border-t border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-2.5">
              <div>
                <h2 className="text-[13px] font-mono font-bold text-[#F5F5F3] uppercase tracking-wider">
                  Reliability Contracts ({contracts.length})
                </h2>
                <p className="text-[12px] text-[#A0A0A4] mt-0.5 font-sans">
                  Map one consequential action to the tools MCPx should use to execute, inspect, and compensate it.
                </p>
              </div>

              <Link
                href={`/app/services/${encodeURIComponent(id)}/contracts/new`}
                className="px-3 py-1.5 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold font-mono text-[12px] transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
              >
                + Create contract
              </Link>
            </div>

            {contracts.length === 0 ? (
              <div className="p-6 border border-dashed border-white/[0.08] bg-[#0B0C0E] text-center space-y-3 font-sans">
                <div className="space-y-1">
                  <span className="text-[13px] font-semibold text-[#F5F5F3] block">
                    No reliability contracts yet.
                  </span>
                  <p className="text-[12px] text-[#A0A0A4] max-w-md mx-auto leading-relaxed">
                    MCPx has discovered {tools.length} tools on this service, but none have been configured with execute, inspect, and compensation semantics.
                  </p>
                </div>
                <Link
                  href={`/app/services/${encodeURIComponent(id)}/contracts/new`}
                  className="px-3.5 py-1.5 rounded bg-[#F5F5F3] text-[#070708] font-mono text-[12px] font-semibold transition-colors inline-block cursor-pointer"
                >
                  Create first contract →
                </Link>
              </div>
            ) : (
              <div className="border border-white/[0.09] bg-[#0B0C0E] divide-y divide-white/[0.06] font-mono text-[12px] overflow-hidden">
                {/* Contracts Header */}
                <div className="hidden sm:grid sm:grid-cols-12 px-4 py-2 text-[10.5px] text-[#66686D] uppercase tracking-wider bg-[#070708]">
                  <div className="col-span-3">Contract</div>
                  <div className="col-span-3">Execute</div>
                  <div className="col-span-2">Inspect</div>
                  <div className="col-span-2">Compensate</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>

                {/* Contract Rows */}
                {contracts.map((ctr) => {
                  const isReady = ctr.status === "READY";
                  const isNeedsReview = ctr.status === "NEEDS_REVIEW";

                  return (
                    <div
                      key={ctr.id}
                      className="p-3.5 sm:px-4 sm:py-3 grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-0 hover:bg-white/[0.015] transition-colors"
                    >
                      <div className="sm:col-span-3 space-y-0.5">
                        <Link
                          href={`/app/services/${encodeURIComponent(id)}/contracts/${encodeURIComponent(ctr.id)}`}
                          className="font-bold text-[#F5F5F3] hover:text-[#A5F36B] transition-colors block font-sans text-[13px]"
                        >
                          {ctr.name}
                        </Link>
                        <span className="text-[10.5px] text-[#66686D] block font-mono">
                          ID: {ctr.operationKeyField}
                        </span>
                      </div>

                      <div className="sm:col-span-3 text-emerald-400 font-mono text-[11.5px] truncate">
                        {ctr.executeToolName}
                      </div>

                      <div className="sm:col-span-2 text-cyan-300 font-mono text-[11.5px] truncate">
                        {ctr.inspectToolName}
                      </div>

                      <div className="sm:col-span-2 text-amber-300 font-mono text-[11.5px] truncate">
                        {ctr.compensateToolName || <span className="text-[#66686D]">None</span>}
                      </div>

                      <div className="sm:col-span-1">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-block ${
                            isReady
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                              : isNeedsReview
                              ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                              : "bg-rose-950/60 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          {ctr.status}
                        </span>
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <Link
                          href={`/app/services/${encodeURIComponent(id)}/contracts/${encodeURIComponent(ctr.id)}`}
                          className="text-[11.5px] font-mono text-[#A0A0A4] hover:text-white transition-colors"
                        >
                          Open →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT RAIL (~32%) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Reference Service Notice */}
          {isReferenceService && (
            <div className="p-4 border border-white/[0.09] bg-[#0F1012] font-mono text-[12px] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#A5F36B]"></span>
                <span className="text-[#A5F36B] font-bold text-[11px] uppercase">
                  REFERENCE SERVICE
                </span>
              </div>
              <p className="text-[#A0A0A4] font-sans text-[12px] leading-relaxed">
                Preconfigured reference service providing sample WebMCP tools and deterministic reliability contracts.
              </p>
            </div>
          )}

          {/* Service & Connection Overview */}
          <div className="p-5 border border-white/[0.09] bg-[#0B0C0E] font-mono text-[12px] space-y-4">
            <div className="text-[11px] text-[#66686D] uppercase tracking-wider border-b border-white/[0.06] pb-2">
              WEBMCP CONNECTION
            </div>

            <div className="space-y-2.5 text-[11.5px]">
              <div>
                <span className="text-[#66686D] block text-[10.5px]">ORIGIN</span>
                <span className="text-[#F5F5F3] font-bold break-all">{service.origin}</span>
              </div>

              <div>
                <span className="text-[#66686D] block text-[10.5px]">EXPOSURE</span>
                <span className="text-emerald-400">Allowed for MCPx origin</span>
              </div>

              <div>
                <span className="text-[#66686D] block text-[10.5px]">DISCOVERED TOOLS</span>
                <span className="text-[#F5F5F3]">{tools.length} tools registered</span>
              </div>

              <div>
                <span className="text-[#66686D] block text-[10.5px]">REGISTERED AT</span>
                <span className="text-[#A0A0A4]">
                  {new Date(service.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Reliability Contract Readiness Summary */}
          <div className="p-5 border border-white/[0.09] bg-[#0B0C0E] font-mono text-[12px] space-y-3">
            <div className="text-[11px] text-[#66686D] uppercase tracking-wider border-b border-white/[0.06] pb-2">
              RELIABILITY SUMMARY
            </div>

            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#A0A0A4]">Contracts configured</span>
                <span className="text-[#F5F5F3] font-bold">{contracts.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-emerald-400">Ready for workflows</span>
                <span className="text-emerald-400 font-bold">{readyContractsCount}</span>
              </div>

              {reviewContractsCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-amber-400">Needs review</span>
                  <span className="text-amber-400 font-bold">{reviewContractsCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Developer Details (Collapsible) */}
          <div className="p-4 border border-white/[0.06] bg-[#070708] font-mono text-[11.5px] space-y-2">
            <button
              type="button"
              onClick={() => setShowDevDetails(!showDevDetails)}
              className="w-full flex items-center justify-between text-[#66686D] hover:text-[#A0A0A4] transition-colors cursor-pointer"
            >
              <span>DEVELOPER DETAILS</span>
              <span>{showDevDetails ? "▾" : "▸"}</span>
            </button>

            {showDevDetails && (
              <div className="space-y-2 pt-2 text-[10.5px] text-[#A0A0A4] border-t border-white/[0.04]">
                <div>Service ID: <code className="text-[#F5F5F3]">{service.id}</code></div>
                <div>Transport: <code className="text-cyan-300">postMessage (JSON-RPC 2.0)</code></div>
                <div>Isolation: <code className="text-emerald-400">Sandboxed Iframe</code></div>
                <div>Updated: <code>{new Date(service.updatedAt).toISOString()}</code></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
