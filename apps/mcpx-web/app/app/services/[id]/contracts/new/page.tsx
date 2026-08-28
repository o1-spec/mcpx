"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/services/AppNav";
import { useReliabilityContracts } from "@/hooks/useReliabilityContracts";
import type { ConnectedServiceRecord } from "@/lib/db";

export default function NewContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { createContract } = useReliabilityContracts(id);

  const [service, setService] = useState<ConnectedServiceRecord | null>(null);
  const [loadingService, setLoadingService] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [executeToolName, setExecuteToolName] = useState("");
  const [inspectToolName, setInspectToolName] = useState("");
  const [compensateToolName, setCompensateToolName] = useState("");
  const [operationKeyField, setOperationKeyField] = useState("operationKey");

  // Developer Assertions
  const [executeIdempotent, setExecuteIdempotent] = useState(false);
  const [inspectAuthoritative, setInspectAuthoritative] = useState(false);
  const [compensateRetrySafe, setCompensateRetrySafe] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadService() {
      try {
        setLoadingService(true);
        const res = await fetch(`/api/services/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setService(data.service);

        // Pre-select first tool if available
        const tools = data.service?.lastDiscoveredTools || [];
        if (tools.length > 0) {
          setExecuteToolName(tools[0].name);
          if (tools.length > 1) {
            setInspectToolName(tools[1].name);
          }
        }
      } catch (err: unknown) {
        console.error("[mcpx-contract-new] load error:", err);
      } finally {
        setLoadingService(false);
      }
    }
    loadService();
  }, [id]);

  const tools = service?.lastDiscoveredTools || [];
  const execTool = tools.find((t) => t.name === executeToolName);
  const inspTool = tools.find((t) => t.name === inspectToolName);
  const compTool = compensateToolName ? tools.find((t) => t.name === compensateToolName) : null;

  // Schema validation checks
  const opKey = operationKeyField.trim();
  const execProps = (execTool?.inputSchema?.properties as Record<string, unknown>) || {};
  const inspProps = (inspTool?.inputSchema?.properties as Record<string, unknown>) || {};
  const compProps = (compTool?.inputSchema?.properties as Record<string, unknown>) || {};

  // Check schema compatibility
  const execAcceptsKey = execTool ? (Object.keys(execProps).length === 0 || opKey in execProps) : false;
  const inspAcceptsKey = inspTool ? (Object.keys(inspProps).length === 0 || opKey in inspProps) : false;
  const compAcceptsKey = compTool ? (Object.keys(compProps).length === 0 || opKey in compProps) : true;

  const hasCompensate = Boolean(compensateToolName);

  // Assertion check
  const assertionsValid =
    executeIdempotent &&
    inspectAuthoritative &&
    (!hasCompensate || compensateRetrySafe);

  // Contract readiness determination
  const isReady =
    Boolean(name.trim()) &&
    Boolean(executeToolName) &&
    Boolean(inspectToolName) &&
    execAcceptsKey &&
    inspAcceptsKey &&
    compAcceptsKey &&
    assertionsValid;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !executeToolName || !inspectToolName) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      await createContract({
        name: name.trim(),
        executeToolName,
        inspectToolName,
        compensateToolName: compensateToolName || null,
        operationKeyField: opKey,
        assertions: {
          executeIdempotent,
          inspectAuthoritative,
          compensateRetrySafe: hasCompensate ? compensateRetrySafe : undefined,
        },
        executeSchemaSnapshot: execTool?.inputSchema || null,
        inspectSchemaSnapshot: inspTool?.inputSchema || null,
        compensateSchemaSnapshot: compTool?.inputSchema || null,
      });

      router.push(`/app/services/${encodeURIComponent(id)}`);
    } catch (err: unknown) {
      console.error("[mcpx-contract-new] save error:", err);
      setIsSaving(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save contract");
    }
  };

  if (loadingService) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <AppNav />
          <div className="py-12 text-center text-xs text-slate-500">
            Loading service tools…
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
        <div className="space-y-1 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-2">
            <Link
              href={`/app/services/${id}`}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to {service?.name || "Service"}
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans">
            Create reliability contract
          </h1>
          <p className="text-xs text-slate-400">
            Map a consequential mutation to its authoritative inspection tool and optional compensation handler.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Operation & Tool Mapping */}
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-5">
            <div className="space-y-1 border-b border-slate-800/60 pb-3">
              <h2 className="text-sm font-semibold text-white">
                1. Operation & Tool Mapping
              </h2>
              <p className="text-xs text-slate-400">
                Pair the mutating tool with an authoritative inspection tool.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="contract-name" className="text-xs font-medium text-slate-300 block">
                  Contract name <span className="text-indigo-400">*</span>
                </label>
                <input
                  id="contract-name"
                  type="text"
                  placeholder="e.g. Create invoice, Provision workspace, Deploy build"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-sans text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Execute Tool */}
                <div className="space-y-1.5">
                  <label htmlFor="exec-tool-select" className="text-xs font-medium text-slate-300 block">
                    Execute tool <span className="text-indigo-400">*</span>
                  </label>
                  <select
                    id="exec-tool-select"
                    value={executeToolName}
                    onChange={(e) => setExecuteToolName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {tools.map((t) => (
                      <option key={t.name} value={t.name} className="text-slate-200 bg-slate-900 font-mono">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 font-sans block">
                    The consequential mutation.
                  </span>
                </div>

                {/* Inspect Tool */}
                <div className="space-y-1.5">
                  <label htmlFor="insp-tool-select" className="text-xs font-medium text-slate-300 block">
                    Inspect tool <span className="text-indigo-400">*</span>
                  </label>
                  <select
                    id="insp-tool-select"
                    value={inspectToolName}
                    onChange={(e) => setInspectToolName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {tools.map((t) => (
                      <option key={t.name} value={t.name} className="text-slate-200 bg-slate-900 font-mono">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 font-sans block">
                    Authoritative ground truth.
                  </span>
                </div>

                {/* Compensate Tool */}
                <div className="space-y-1.5">
                  <label htmlFor="comp-tool-select" className="text-xs font-medium text-slate-300 block">
                    Compensate tool <span className="text-slate-500 text-[10px]">(optional)</span>
                  </label>
                  <select
                    id="comp-tool-select"
                    value={compensateToolName}
                    onChange={(e) => setCompensateToolName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-rose-400 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="" className="text-slate-500 bg-slate-900 font-sans">
                      None (Compensation unavailable)
                    </option>
                    {tools.map((t) => (
                      <option key={t.name} value={t.name} className="text-slate-200 bg-slate-900 font-mono">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 font-sans block">
                    Undo/rollback handler.
                  </span>
                </div>
              </div>

              {/* Operation Identity Field */}
              <div className="space-y-1.5 pt-1">
                <label htmlFor="op-key-field" className="text-xs font-medium text-slate-300 block">
                  Operation identity field
                </label>
                <input
                  id="op-key-field"
                  type="text"
                  value={operationKeyField}
                  onChange={(e) => setOperationKeyField(e.target.value)}
                  placeholder="operationKey, idempotencyKey, requestId"
                  className="w-full max-w-xs px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <span className="text-[11px] text-slate-500 font-sans block">
                  The shared argument name used across execute, inspect, and compensate calls.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Developer Assertions */}
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4">
            <div className="space-y-1 border-b border-slate-800/60 pb-3">
              <h2 className="text-sm font-semibold text-white">
                2. Developer Assertions
              </h2>
              <p className="text-xs text-slate-400">
                Confirm the semantic guarantees provided by the service implementation.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={executeIdempotent}
                  onChange={(e) => setExecuteIdempotent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  <strong>Execute idempotency:</strong> The execute action (<code className="font-mono text-emerald-400">{executeToolName}</code>) treats the operation identity idempotently.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inspectAuthoritative}
                  onChange={(e) => setInspectAuthoritative(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  <strong>Authoritative ground truth:</strong> Inspect (<code className="font-mono text-cyan-400">{inspectToolName}</code>) returns accurate remote state for the resource created by this operation identity.
                </span>
              </label>

              {hasCompensate && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={compensateRetrySafe}
                    onChange={(e) => setCompensateRetrySafe(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-slate-300">
                    <strong>Safe compensation:</strong> Compensation (<code className="font-mono text-rose-400">{compensateToolName}</code>) is safe to retry and idempotent.
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Section 3: Validation Summary Card */}
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Reliability contract validation
              </span>
              <span
                className={`text-xs font-mono px-2.5 py-0.5 rounded border ${
                  isReady
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                }`}
              >
                {isReady ? "READY" : "INVALID"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Execute (<code className="font-mono text-slate-300">{executeToolName || "none"}</code>)</span>
                <span className={execTool ? "text-emerald-400" : "text-rose-400"}>
                  {execTool ? "✓ Tool available" : "✕ Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Inspect (<code className="font-mono text-slate-300">{inspectToolName || "none"}</code>)</span>
                <span className={inspTool ? "text-emerald-400" : "text-rose-400"}>
                  {inspTool ? "✓ Tool available" : "✕ Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Compensate (<code className="font-mono text-slate-300">{compensateToolName || "None"}</code>)</span>
                <span className={hasCompensate ? (compTool ? "text-emerald-400" : "text-rose-400") : "text-slate-500"}>
                  {hasCompensate ? (compTool ? "✓ Tool available" : "✕ Missing") : "Not configured (Undo disabled)"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Operation identity (<code className="font-mono text-amber-300">{opKey}</code>)</span>
                <span className={execAcceptsKey && inspAcceptsKey && compAcceptsKey ? "text-emerald-400" : "text-amber-400"}>
                  {execAcceptsKey && inspAcceptsKey && compAcceptsKey ? "✓ Accepted across contract" : "⚠ Not found in tool schemas"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Developer assertions</span>
                <span className={assertionsValid ? "text-emerald-400" : "text-amber-400"}>
                  {assertionsValid ? "✓ Confirmed" : "⚠ Confirmation required"}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Validating metadata only · No remote tools are executed.
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save contract"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
