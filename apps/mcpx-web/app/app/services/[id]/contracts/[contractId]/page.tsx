"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReliabilityContracts } from "@/hooks/useReliabilityContracts";
import type { ConnectedServiceRecord, ReliabilityContractRecord } from "@/lib/db";

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string; contractId: string }>;
}) {
  const { id, contractId } = use(params);
  const router = useRouter();
  const { deleteContract } = useReliabilityContracts(id);

  const [service, setService] = useState<ConnectedServiceRecord | null>(null);
  const [contract, setContract] = useState<ReliabilityContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRawSchemas, setShowRawSchemas] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [srvRes, ctrRes] = await Promise.all([
          fetch(`/api/services/${encodeURIComponent(id)}`),
          fetch(`/api/services/${encodeURIComponent(id)}/contracts/${encodeURIComponent(contractId)}`),
        ]);

        if (!srvRes.ok) throw new Error("Service not found");
        if (!ctrRes.ok) throw new Error("Contract not found");

        const srvData = await srvRes.json();
        const ctrData = await ctrRes.json();

        setService(srvData.service);
        setContract(ctrData.contract);
      } catch (err: unknown) {
        console.error("[mcpx-contract-detail] load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load contract details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, contractId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteContract(contractId);
      router.push(`/app/services/${encodeURIComponent(id)}`);
    } catch (err: unknown) {
      console.error("[mcpx-contract-detail] delete error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete contract");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-subtle space-y-2">
        <div className="w-4 h-4 border-2 border-white/20 border-t-accent-lime rounded-full animate-spin mx-auto"></div>
        <div>Loading contract configuration…</div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-6 border border-rose-500/30 bg-panel font-mono text-xs text-rose-300 space-y-3">
        <h2 className="font-semibold text-sm text-rose-400">[ CONTRACT NOT FOUND ]</h2>
        <p className="text-muted">{error || "Could not retrieve contract details."}</p>
        <Link
          href={`/app/services/${id}`}
          className="text-foreground hover:text-foreground font-medium inline-block underline pt-1"
        >
          ← Back to {service?.name || "Service"}
        </Link>
      </div>
    );
  }

  const isReady = contract.status === "READY";
  const isNeedsReview = contract.status === "NEEDS_REVIEW";

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Header & Back Navigation */}
      <div className="space-y-3 border-b border-white/8 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-subtle">
          <Link href="/app/services" className="hover:text-foreground transition-colors">
            Services
          </Link>
          <span>/</span>
          <Link
            href={`/app/services/${id}`}
            className="hover:text-foreground transition-colors"
          >
            {service?.name || "Service"}
          </Link>
          <span>/</span>
          <span className="text-muted">{contract.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight font-sans">
                {contract.name}
              </h1>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${isReady
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                    : isNeedsReview
                      ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                      : "bg-rose-950/60 text-rose-300 border-rose-500/40"
                  }`}
              >
                {contract.status}
              </span>
            </div>

            <div className="text-xs font-mono text-muted">
              Service: <span className="text-foreground">{service?.name}</span> ({service?.origin})
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded bg-transparent hover:bg-rose-950/30 border border-white/8 hover:border-rose-500/40 text-subtle hover:text-rose-400 font-mono text-xs transition-colors cursor-pointer"
            >
              Delete contract
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="p-5 border border-rose-500/40 bg-[#0F1012] font-mono text-xs space-y-3 animate-in fade-in duration-150">
          <div className="text-rose-400 font-bold">[ DELETE RELIABILITY CONTRACT ]</div>
          <p className="text-muted font-sans text-xs leading-relaxed">
            This will remove this reliability mapping from MCPx. Workflows relying on this contract will require reconfiguration.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Confirm delete"}
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

      {/* Needs Review Alert Banner */}
      {isNeedsReview && (
        <div className="p-4 border border-amber-500/40 bg-amber-950/20 font-mono text-xs text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>NEEDS REVIEW: SERVICE TOOL MISMATCH</span>
          </div>
          <p className="text-xs text-muted font-sans">
            One or more mapped tools are no longer exposed by the target service. Workflow execution using this contract is blocked until re-mapped.
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2-COLUMN TECHNICAL CONTROL PLANE LAYOUT */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT / MAIN COLUMN (~68%): VISUAL RELIABILITY CHAIN */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 border border-white/9 bg-panel space-y-6">
            <div className="flex items-center justify-between border-b border-white/6 pb-3 font-mono text-xs text-subtle">
              <span>RELIABILITY CHAIN SCHEMATIC</span>
              <span>IDENTITY: {contract.operationKeyField}</span>
            </div>

            {/* Technical Diagram Chain */}
            <div className="space-y-4 max-w-lg mx-auto py-2 font-mono text-xs">
              {/* [01] EXECUTE */}
              <div className="border border-white/8 bg-background p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-subtle font-bold">[ 01 ] EXECUTE</span>
                  <span className="text-emerald-400">Consequential Mutation</span>
                </div>
                <div className="text-sm font-bold text-foreground">
                  {contract.executeToolName}
                </div>
                <p className="text-xs text-muted font-sans">
                  Dispatches consequential mutation with deterministic identity.
                </p>
              </div>

              {/* Connecting Line 1 */}
              <div className="flex flex-col items-center">
                <div className="h-6 w-px bg-white/20"></div>
                <span className="px-2 py-0.5 text-xs bg-panel border border-white/10 text-amber-300">
                  identity: {contract.operationKeyField}
                </span>
                <div className="h-6 w-px bg-white/20"></div>
              </div>

              {/* [02] INSPECT */}
              <div className="border border-cyan-500/30 bg-background p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-subtle font-bold">[ 02 ] INSPECT</span>
                  <span className="text-cyan-300">Authoritative Ground Truth</span>
                </div>
                <div className="text-sm font-bold text-foreground">
                  {contract.inspectToolName}
                </div>
                <p className="text-xs text-muted font-sans">
                  Queries state-owning application to resolve uncertain outcomes without blind retries.
                </p>
              </div>

              {/* Connecting Line 2 */}
              <div className="flex flex-col items-center">
                <div className="h-6 w-px bg-white/20"></div>
                <span className="px-2 py-0.5 text-xs bg-panel border border-white/10 text-subtle">
                  if downstream rollback required
                </span>
                <div className="h-6 w-px bg-white/20"></div>
              </div>

              {/* [03] COMPENSATE */}
              <div className="border border-amber-500/30 bg-background p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-subtle font-bold">[ 03 ] COMPENSATE</span>
                  <span className={contract.compensateToolName ? "text-amber-300" : "text-subtle"}>
                    {contract.compensateToolName ? "Reverse Rollback" : "Not Configured"}
                  </span>
                </div>
                <div className="text-sm font-bold text-foreground">
                  {contract.compensateToolName || "No automatic compensation"}
                </div>
                <p className="text-xs text-muted font-sans">
                  {contract.compensateToolName
                    ? "Safely undos completed action in reverse dependency order."
                    : "Workflows using this action will halt for operator attention if rollback is needed."}
                </p>
              </div>
            </div>
          </div>

          {/* Schema Snapshots (Collapsible) */}
          <div className="p-4 border border-white/6 bg-background font-mono text-xs space-y-2">
            <button
              type="button"
              onClick={() => setShowRawSchemas(!showRawSchemas)}
              className="w-full flex items-center justify-between text-subtle hover:text-muted transition-colors cursor-pointer"
            >
              <span>RAW SCHEMA SNAPSHOTS</span>
              <span>{showRawSchemas ? "▾" : "▸"}</span>
            </button>

            {showRawSchemas && (
              <div className="space-y-3 pt-2 text-xs text-muted border-t border-white/4">
                <div>
                  <span className="text-subtle block">Execute ({contract.executeToolName}):</span>
                  <pre className="mt-1 p-2 bg-panel border border-white/6 whitespace-pre-wrap break-all">
                    {JSON.stringify(contract.executeSchemaSnapshot, null, 2) || "No snapshot"}
                  </pre>
                </div>
                <div>
                  <span className="text-subtle block">Inspect ({contract.inspectToolName}):</span>
                  <pre className="mt-1 p-2 bg-panel border border-white/6 whitespace-pre-wrap break-all">
                    {JSON.stringify(contract.inspectSchemaSnapshot, null, 2) || "No snapshot"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT RAIL (~32%): ASSERTIONS & METADATA */}
        <div className="lg:col-span-4 space-y-5">
          {/* Declared Assertions */}
          <div className="p-5 border border-white/9 bg-panel font-mono text-xs space-y-4">
            <div className="text-xs text-subtle uppercase tracking-wider border-b border-white/6 pb-2">
              DECLARED ASSERTIONS
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-start gap-2">
                <span className={contract.assertions.executeIdempotent ? "text-emerald-400 font-bold" : "text-subtle"}>
                  {contract.assertions.executeIdempotent ? "✓" : "✕"}
                </span>
                <div>
                  <strong className="text-foreground block font-mono text-xs">Execute Idempotency</strong>
                  <span className="text-muted">Safe against duplicate execution with same identity.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className={contract.assertions.inspectAuthoritative ? "text-emerald-400 font-bold" : "text-subtle"}>
                  {contract.assertions.inspectAuthoritative ? "✓" : "✕"}
                </span>
                <div>
                  <strong className="text-foreground block font-mono text-xs">Authoritative Ground Truth</strong>
                  <span className="text-muted">Inspect queries target state owner.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className={contract.assertions.compensateRetrySafe ? "text-emerald-400 font-bold" : "text-subtle"}>
                  {contract.assertions.compensateRetrySafe ? "✓" : "—"}
                </span>
                <div>
                  <strong className="text-foreground block font-mono text-xs">Safe Compensation</strong>
                  <span className="text-muted">
                    {contract.compensateToolName ? "Idempotent reverse deletion handler." : "No compensation handler defined."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="p-5 border border-white/9 bg-panel font-mono text-xs space-y-3">
            <div className="text-xs text-subtle uppercase tracking-wider border-b border-white/6 pb-2">
              CONTRACT METADATA
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-subtle block text-xs">CONTRACT ID</span>
                <span className="text-foreground break-all">{contract.id}</span>
              </div>
              <div>
                <span className="text-subtle block text-xs">CREATED</span>
                <span className="text-muted">{new Date(contract.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-subtle block text-xs">LAST UPDATED</span>
                <span className="text-muted">{new Date(contract.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
