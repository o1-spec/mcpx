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
      <div className="py-20 text-center font-mono text-xs text-[#66686D] space-y-2">
        <div className="w-4 h-4 border-2 border-white/20 border-t-[#A5F36B] rounded-full animate-spin mx-auto"></div>
        <div>Loading contract configuration…</div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-6 border border-rose-500/30 bg-[#0B0C0E] font-mono text-xs text-rose-300 space-y-3">
        <h2 className="font-semibold text-sm text-rose-400">[ CONTRACT NOT FOUND ]</h2>
        <p className="text-[#A0A0A4]">{error || "Could not retrieve contract details."}</p>
        <Link
          href={`/app/services/${id}`}
          className="text-[#F5F5F3] hover:text-white font-medium inline-block underline pt-1"
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
      <div className="space-y-3 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 text-[12px] font-mono text-[#66686D]">
          <Link href="/app/services" className="hover:text-[#F5F5F3] transition-colors">
            Services
          </Link>
          <span>/</span>
          <Link
            href={`/app/services/${id}`}
            className="hover:text-[#F5F5F3] transition-colors"
          >
            {service?.name || "Service"}
          </Link>
          <span>/</span>
          <span className="text-[#A0A0A4]">{contract.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] sm:text-[24px] font-bold text-[#F5F5F3] tracking-tight font-sans">
                {contract.name}
              </h1>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border font-bold ${
                  isReady
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                    : isNeedsReview
                    ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                    : "bg-rose-950/60 text-rose-300 border-rose-500/40"
                }`}
              >
                {contract.status}
              </span>
            </div>

            <div className="text-[12px] font-mono text-[#A0A0A4]">
              Service: <span className="text-[#F5F5F3]">{service?.name}</span> ({service?.origin})
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded bg-transparent hover:bg-rose-950/30 border border-white/[0.08] hover:border-rose-500/40 text-[#66686D] hover:text-rose-400 font-mono text-[12px] transition-colors cursor-pointer"
            >
              Delete contract
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="p-5 border border-rose-500/40 bg-[#0F1012] font-mono text-[12px] space-y-3 animate-in fade-in duration-150">
          <div className="text-rose-400 font-bold">[ DELETE RELIABILITY CONTRACT ]</div>
          <p className="text-[#A0A0A4] font-sans text-[13px] leading-relaxed">
            This will remove this reliability mapping from MCPx. Workflows relying on this contract will require reconfiguration.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[12px] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Confirm delete"}
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

      {/* Needs Review Alert Banner */}
      {isNeedsReview && (
        <div className="p-4 border border-amber-500/40 bg-amber-950/20 font-mono text-[12px] text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>NEEDS REVIEW: SERVICE TOOL MISMATCH</span>
          </div>
          <p className="text-[12px] text-[#A0A0A4] font-sans">
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
          <div className="p-6 border border-white/[0.09] bg-[#0B0C0E] space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 font-mono text-[11px] text-[#66686D]">
              <span>RELIABILITY CHAIN SCHEMATIC</span>
              <span>IDENTITY: {contract.operationKeyField}</span>
            </div>

            {/* Technical Diagram Chain */}
            <div className="space-y-4 max-w-lg mx-auto py-2 font-mono text-[12px]">
              {/* [01] EXECUTE */}
              <div className="border border-white/[0.08] bg-[#070708] p-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#66686D] font-bold">[ 01 ] EXECUTE</span>
                  <span className="text-emerald-400">Consequential Mutation</span>
                </div>
                <div className="text-[14px] font-bold text-[#F5F5F3]">
                  {contract.executeToolName}
                </div>
                <p className="text-[12px] text-[#A0A0A4] font-sans">
                  Dispatches consequential mutation with deterministic identity.
                </p>
              </div>

              {/* Connecting Line 1 */}
              <div className="flex flex-col items-center">
                <div className="h-6 w-[1px] bg-white/20"></div>
                <span className="px-2 py-0.5 text-[10px] bg-[#0B0C0E] border border-white/10 text-amber-300">
                  identity: {contract.operationKeyField}
                </span>
                <div className="h-6 w-[1px] bg-white/20"></div>
              </div>

              {/* [02] INSPECT */}
              <div className="border border-cyan-500/30 bg-[#070708] p-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#66686D] font-bold">[ 02 ] INSPECT</span>
                  <span className="text-cyan-300">Authoritative Ground Truth</span>
                </div>
                <div className="text-[14px] font-bold text-[#F5F5F3]">
                  {contract.inspectToolName}
                </div>
                <p className="text-[12px] text-[#A0A0A4] font-sans">
                  Queries state-owning application to resolve uncertain outcomes without blind retries.
                </p>
              </div>

              {/* Connecting Line 2 */}
              <div className="flex flex-col items-center">
                <div className="h-6 w-[1px] bg-white/20"></div>
                <span className="px-2 py-0.5 text-[10px] bg-[#0B0C0E] border border-white/10 text-[#66686D]">
                  if downstream rollback required
                </span>
                <div className="h-6 w-[1px] bg-white/20"></div>
              </div>

              {/* [03] COMPENSATE */}
              <div className="border border-amber-500/30 bg-[#070708] p-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#66686D] font-bold">[ 03 ] COMPENSATE</span>
                  <span className={contract.compensateToolName ? "text-amber-300" : "text-[#66686D]"}>
                    {contract.compensateToolName ? "Reverse Rollback" : "Not Configured"}
                  </span>
                </div>
                <div className="text-[14px] font-bold text-[#F5F5F3]">
                  {contract.compensateToolName || "No automatic compensation"}
                </div>
                <p className="text-[12px] text-[#A0A0A4] font-sans">
                  {contract.compensateToolName
                    ? "Safely undos completed action in reverse dependency order."
                    : "Workflows using this action will halt for operator attention if rollback is needed."}
                </p>
              </div>
            </div>
          </div>

          {/* Schema Snapshots (Collapsible) */}
          <div className="p-4 border border-white/[0.06] bg-[#070708] font-mono text-[11.5px] space-y-2">
            <button
              type="button"
              onClick={() => setShowRawSchemas(!showRawSchemas)}
              className="w-full flex items-center justify-between text-[#66686D] hover:text-[#A0A0A4] transition-colors cursor-pointer"
            >
              <span>RAW SCHEMA SNAPSHOTS</span>
              <span>{showRawSchemas ? "▾" : "▸"}</span>
            </button>

            {showRawSchemas && (
              <div className="space-y-3 pt-2 text-[10.5px] text-[#A0A0A4] border-t border-white/[0.04]">
                <div>
                  <span className="text-[#66686D] block">Execute ({contract.executeToolName}):</span>
                  <pre className="mt-1 p-2 bg-[#0B0C0E] border border-white/[0.06] whitespace-pre-wrap break-all">
                    {JSON.stringify(contract.executeSchemaSnapshot, null, 2) || "No snapshot"}
                  </pre>
                </div>
                <div>
                  <span className="text-[#66686D] block">Inspect ({contract.inspectToolName}):</span>
                  <pre className="mt-1 p-2 bg-[#0B0C0E] border border-white/[0.06] whitespace-pre-wrap break-all">
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
          <div className="p-5 border border-white/[0.09] bg-[#0B0C0E] font-mono text-[12px] space-y-4">
            <div className="text-[11px] text-[#66686D] uppercase tracking-wider border-b border-white/[0.06] pb-2">
              DECLARED ASSERTIONS
            </div>

            <div className="space-y-3 font-sans text-[12px]">
              <div className="flex items-start gap-2">
                <span className={contract.assertions.executeIdempotent ? "text-emerald-400 font-bold" : "text-[#66686D]"}>
                  {contract.assertions.executeIdempotent ? "✓" : "✕"}
                </span>
                <div>
                  <strong className="text-[#F5F5F3] block font-mono text-[11.5px]">Execute Idempotency</strong>
                  <span className="text-[#A0A0A4]">Safe against duplicate execution with same identity.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className={contract.assertions.inspectAuthoritative ? "text-emerald-400 font-bold" : "text-[#66686D]"}>
                  {contract.assertions.inspectAuthoritative ? "✓" : "✕"}
                </span>
                <div>
                  <strong className="text-[#F5F5F3] block font-mono text-[11.5px]">Authoritative Ground Truth</strong>
                  <span className="text-[#A0A0A4]">Inspect queries target state owner.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className={contract.assertions.compensateRetrySafe ? "text-emerald-400 font-bold" : "text-[#66686D]"}>
                  {contract.assertions.compensateRetrySafe ? "✓" : "—"}
                </span>
                <div>
                  <strong className="text-[#F5F5F3] block font-mono text-[11.5px]">Safe Compensation</strong>
                  <span className="text-[#A0A0A4]">
                    {contract.compensateToolName ? "Idempotent reverse deletion handler." : "No compensation handler defined."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="p-5 border border-white/[0.09] bg-[#0B0C0E] font-mono text-[12px] space-y-3">
            <div className="text-[11px] text-[#66686D] uppercase tracking-wider border-b border-white/[0.06] pb-2">
              CONTRACT METADATA
            </div>

            <div className="space-y-2 text-[11.5px]">
              <div>
                <span className="text-[#66686D] block text-[10.5px]">CONTRACT ID</span>
                <span className="text-[#F5F5F3] break-all">{contract.id}</span>
              </div>
              <div>
                <span className="text-[#66686D] block text-[10.5px]">CREATED</span>
                <span className="text-[#A0A0A4]">{new Date(contract.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[#66686D] block text-[10.5px]">LAST UPDATED</span>
                <span className="text-[#A0A0A4]">{new Date(contract.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
