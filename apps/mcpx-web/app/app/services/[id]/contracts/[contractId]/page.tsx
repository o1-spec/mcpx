"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/services/AppNav";
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
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <AppNav />
          <div className="py-12 text-center text-xs text-slate-500">
            Loading contract details…
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <AppNav />
          <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 space-y-3">
            <h2 className="font-semibold text-sm">Contract not found</h2>
            <p className="text-slate-400">{error || "Could not retrieve contract details."}</p>
            <Link
              href={`/app/services/${id}`}
              className="text-indigo-400 hover:text-indigo-300 font-medium inline-block"
            >
              ← Back to {service?.name || "Service"}
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/app/services/${id}`}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Back to {service?.name || "Service"}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                {contract.name}
              </h1>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  contract.status === "READY"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                    : contract.status === "NEEDS_REVIEW"
                    ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                    : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                }`}
              >
                {contract.status}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Service: <span className="text-slate-200 font-medium">{service?.name}</span> ({service?.origin})
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 text-rose-300 transition-colors cursor-pointer"
            >
              Delete contract
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="p-5 rounded-2xl border border-rose-500/40 bg-rose-950/30 space-y-3 animate-in fade-in duration-150">
            <h3 className="text-sm font-semibold text-white">
              Delete this reliability contract?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will remove the contract configuration from MCPx. It does not alter anything in the external application.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Confirm delete"}
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

        {/* Contract Details Card */}
        <section className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-5">
          <h2 className="text-sm font-semibold text-white border-b border-slate-800/60 pb-3">
            Tool Mapping & Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-500 text-[11px] block">Execute</span>
              <span className="font-mono text-emerald-400 font-medium block">
                {contract.executeToolName}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-500 text-[11px] block">Inspect</span>
              <span className="font-mono text-cyan-400 font-medium block">
                {contract.inspectToolName}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-500 text-[11px] block">Compensate</span>
              <span className="font-mono text-rose-400 font-medium block">
                {contract.compensateToolName || "None (Compensation unavailable)"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 font-sans">Operation identity field:</span>
            <span className="text-amber-300">{contract.operationKeyField}</span>
          </div>
        </section>

        {/* Developer Assertions */}
        <section className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4">
          <h2 className="text-sm font-semibold text-white border-b border-slate-800/60 pb-3">
            Declared Assertions
          </h2>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className={contract.assertions.executeIdempotent ? "text-emerald-400" : "text-slate-600"}>
                {contract.assertions.executeIdempotent ? "✓" : "○"}
              </span>
              <span>Execute is idempotent for <code className="font-mono text-amber-300">{contract.operationKeyField}</code></span>
            </div>

            <div className="flex items-center gap-2">
              <span className={contract.assertions.inspectAuthoritative ? "text-emerald-400" : "text-slate-600"}>
                {contract.assertions.inspectAuthoritative ? "✓" : "○"}
              </span>
              <span>Inspect returns authoritative state for the created resource</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={contract.assertions.compensateRetrySafe ? "text-emerald-400" : "text-slate-600"}>
                {contract.assertions.compensateRetrySafe ? "✓" : "○"}
              </span>
              <span>Compensation is safe to retry / idempotent</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
