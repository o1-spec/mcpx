"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WebMCPServiceFrame from "@/components/services/WebMCPServiceFrame";
import ServiceToolsList from "@/components/services/ServiceToolsList";
import ServiceContractsList from "@/components/services/ServiceContractsList";
import ServiceSidebarRail from "@/components/services/ServiceSidebarRail";
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

  const tools = service?.lastDiscoveredTools || [];

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
      <div className="py-20 text-center font-mono text-xs text-subtle space-y-2">
        <div className="w-4 h-4 border-2 border-white/20 border-t-accent-lime rounded-full animate-spin mx-auto" />
        <div>Loading service metadata…</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="p-6 border border-rose-500/30 bg-panel font-mono text-xs text-rose-300 space-y-3">
        <h2 className="font-semibold text-sm text-rose-400">[ SERVICE NOT FOUND ]</h2>
        <p className="text-muted">{error || "Could not retrieve connected service record."}</p>
        <Link
          href="/app/services"
          className="text-foreground hover:text-foreground font-medium inline-block underline pt-1"
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

      {/* 1. Top Header & Metadata Bar */}
      <div className="space-y-3 border-b border-white/8 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-subtle">
          <Link href="/app/services" className="hover:text-foreground transition-colors">
            Services
          </Link>
          <span>/</span>
          <span className="text-muted">{service.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight font-sans">
              {service.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-muted">
              <span className="text-foreground">{service.origin}</span>
              <span className="text-subtle">·</span>
              <span>{tools.length} WebMCP tools</span>
              <span className="text-subtle">·</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
              {service.lastDiscoveredAt && (
                <>
                  <span className="text-subtle">·</span>
                  <span className="text-subtle">
                    Discovered {new Date(service.lastDiscoveredAt).toLocaleTimeString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleRediscover}
              disabled={isRediscovering}
              className="px-3 py-1.5 rounded bg-white/4 hover:bg-white/8 border border-white/9 text-foreground font-mono text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isRediscovering ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Rediscovering…</span>
                </>
              ) : (
                <span>Refresh tools</span>
              )}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded bg-transparent hover:bg-rose-950/30 border border-white/8 hover:border-rose-500/40 text-subtle hover:text-rose-400 font-mono text-xs transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {rediscoverSuccess && (
        <div className="p-3 border border-emerald-500/40 bg-emerald-950/20 font-mono text-xs text-emerald-300 animate-in fade-in duration-200">
          ✓ WebMCP tool registry successfully refreshed from origin.
        </div>
      )}

      {/* Delete Confirmation Card */}
      {showDeleteConfirm && (
        <div className="p-5 border border-rose-500/40 bg-[#0F1012] font-mono text-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <span>[ DISCONNECT SERVICE ]</span>
          </div>
          <p className="text-muted font-sans text-xs leading-relaxed">
            This removes the service and its contract mappings from your MCPx control plane. It does not alter the target WebMCP application runtime.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Disconnecting…" : "Confirm disconnect"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 rounded bg-white/4 text-muted hover:text-foreground border border-white/9 transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 2. Main 2-Column Control Plane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Discovered Tools & Contracts */}
        <div className="lg:col-span-8 space-y-8">
          <ServiceToolsList tools={tools} toolUsageMap={toolUsageMap} />
          <ServiceContractsList serviceId={id} contracts={contracts} toolCount={tools.length} />
        </div>

        {/* Right Column: Connection & Readiness Overview */}
        <div className="lg:col-span-4 space-y-5">
          <ServiceSidebarRail
            service={service}
            contracts={contracts}
            isReferenceService={isReferenceService}
            toolCount={tools.length}
          />
        </div>
      </div>
    </div>
  );
}
