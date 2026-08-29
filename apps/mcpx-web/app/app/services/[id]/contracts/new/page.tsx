"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  const [name, setName] = useState("");
  const [executeToolName, setExecuteToolName] = useState("");
  const [inspectToolName, setInspectToolName] = useState("");
  const [compensateToolName, setCompensateToolName] = useState("");
  const [operationKeyField, setOperationKeyField] = useState("operationKey");

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

        const tools = data.service?.lastDiscoveredTools || [];
        if (tools.length > 0) {
          // Default guess
          const createTool = tools.find((t: { name: string }) => t.name.startsWith("create_") || t.name.startsWith("deploy_") || t.name.startsWith("provision_"));
          const getTool = tools.find((t: { name: string }) => t.name.startsWith("get_") || t.name.startsWith("inspect_") || t.name.startsWith("query_"));
          const deleteTool = tools.find((t: { name: string }) => t.name.startsWith("delete_") || t.name.startsWith("unpublish_") || t.name.startsWith("destroy_"));

          setExecuteToolName(createTool ? createTool.name : tools[0].name);
          if (getTool) setInspectToolName(getTool.name);
          else if (tools.length > 1) setInspectToolName(tools[1].name);
          if (deleteTool) setCompensateToolName(deleteTool.name);
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

  const opKey = operationKeyField.trim();
  const execProps = (execTool?.inputSchema?.properties as Record<string, { type?: string }>) || {};
  const inspProps = (inspTool?.inputSchema?.properties as Record<string, { type?: string }>) || {};
  const compProps = (compTool?.inputSchema?.properties as Record<string, { type?: string }>) || {};

  const execAcceptsKey = execTool ? (Object.keys(execProps).length === 0 || opKey in execProps) : false;
  const inspAcceptsKey = inspTool ? (Object.keys(inspProps).length === 0 || opKey in inspProps) : false;
  const compAcceptsKey = compTool ? (Object.keys(compProps).length === 0 || opKey in compProps) : true;

  const hasCompensate = Boolean(compensateToolName);

  const assertionsValid =
    executeIdempotent &&
    inspectAuthoritative &&
    (!hasCompensate || compensateRetrySafe);

  // Issues list for readiness panel
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!name.trim()) issues.push("Contract name is required");
    if (!executeToolName) issues.push("Execute tool not selected");
    if (!inspectToolName) issues.push("Inspect tool not selected");
    if (!execAcceptsKey && execTool) issues.push(`Execute (${executeToolName}) does not declare '${opKey}'`);
    if (!inspAcceptsKey && inspTool) issues.push(`Inspect (${inspectToolName}) does not declare '${opKey}'`);
    if (!compAcceptsKey && compTool) issues.push(`Compensate (${compensateToolName}) does not declare '${opKey}'`);
    if (!executeIdempotent) issues.push("Execute idempotency assertion not confirmed");
    if (!inspectAuthoritative) issues.push("Authoritative inspection assertion not confirmed");
    if (hasCompensate && !compensateRetrySafe) issues.push("Compensation safety assertion not confirmed");
    return issues;
  }, [
    name,
    executeToolName,
    inspectToolName,
    compensateToolName,
    opKey,
    execAcceptsKey,
    inspAcceptsKey,
    compAcceptsKey,
    executeIdempotent,
    inspectAuthoritative,
    compensateRetrySafe,
    hasCompensate,
    execTool,
    inspTool,
    compTool,
  ]);

  const isReady = validationIssues.length === 0;

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
      <div className="py-20 text-center font-mono text-xs text-subtle space-y-2">
        <div className="w-4 h-4 border-2 border-white/20 border-t-accent-lime rounded-full animate-spin mx-auto"></div>
        <div>Loading service tools…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="space-y-2 border-b border-white/8 pb-5">
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
          <span className="text-muted">New Contract</span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight font-sans">
            New Reliability Contract
          </h1>
          <p className="text-xs text-muted font-sans mt-0.5">
            Define how MCPx should execute, inspect, and compensate one logical operation.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 border border-rose-500/40 bg-rose-950/20 font-mono text-xs text-rose-300">
          ✕ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT / MAIN COLUMN (~68%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Contract Name */}
          <div className="p-5 border border-white/9 bg-panel space-y-3 font-mono text-xs">
            <div className="text-xs text-subtle uppercase tracking-wider">
              CONTRACT IDENTITY
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contract-name" className="text-xs font-medium text-foreground block font-sans">
                Contract name <span className="text-accent-lime">*</span>
              </label>
              <input
                id="contract-name"
                type="text"
                placeholder="e.g. Create Widget, Provision Database, Deploy Routing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-background border border-white/9 text-xs font-sans text-foreground placeholder-subtle focus:outline-none focus:border-white/30"
                required
              />
            </div>
          </div>

          {/* Step 01: Execute Mapping */}
          <div className="p-5 border border-white/9 bg-panel space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/6 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-accent-lime border border-accent-lime/30 text-xs">
                  01
                </span>
                <span className="font-bold text-foreground">EXECUTE</span>
              </div>
              <span className="text-xs text-subtle">CONSEQUENTIAL ACTION</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="exec-select" className="text-xs text-muted font-sans block">
                Which WebMCP tool performs the consequential mutation?
              </label>
              <select
                id="exec-select"
                value={executeToolName}
                onChange={(e) => setExecuteToolName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-background border border-white/9 text-foreground font-mono text-xs focus:outline-none focus:border-white/30"
                required
              >
                {tools.map((t) => (
                  <option key={t.name} value={t.name} className="bg-panel text-foreground">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Tool Schema Preview */}
            {execTool && (
              <div className="pt-2 border-t border-white/4 space-y-1.5 text-xs">
                <span className="text-subtle block">Declared parameters:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(execProps).map((k) => (
                    <span key={k} className="px-2 py-0.5 rounded bg-background border border-white/6 text-muted">
                      {k}: <span className="text-cyan-300">{execProps[k]?.type || "any"}</span>
                    </span>
                  ))}
                  {Object.keys(execProps).length === 0 && (
                    <span className="text-subtle">No parameters declared in schema</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 02: Inspect Mapping */}
          <div className="p-5 border border-white/9 bg-panel space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/6 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs">
                  02
                </span>
                <span className="font-bold text-foreground">INSPECT</span>
              </div>
              <span className="text-xs text-subtle">AUTHORITATIVE GROUND TRUTH</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="insp-select" className="text-xs text-muted font-sans block">
                Which tool tells MCPx what authoritative state currently exists?
              </label>
              <select
                id="insp-select"
                value={inspectToolName}
                onChange={(e) => setInspectToolName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-background border border-white/9 text-foreground font-mono text-xs focus:outline-none focus:border-white/30"
                required
              >
                {tools.map((t) => (
                  <option key={t.name} value={t.name} className="bg-panel text-foreground">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {inspTool && (
              <div className="pt-2 border-t border-white/4 space-y-1.5 text-xs">
                <span className="text-subtle block">Declared parameters:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(inspProps).map((k) => (
                    <span key={k} className="px-2 py-0.5 rounded bg-background border border-white/6 text-muted">
                      {k}: <span className="text-cyan-300">{inspProps[k]?.type || "any"}</span>
                    </span>
                  ))}
                  {Object.keys(inspProps).length === 0 && (
                    <span className="text-subtle">No parameters declared in schema</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 03: Compensate Mapping */}
          <div className="p-5 border border-white/9 bg-panel space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/6 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 text-xs">
                  03
                </span>
                <span className="font-bold text-foreground">COMPENSATE</span>
              </div>
              <span className="text-xs text-subtle">REVERSE ROLLBACK HANDLER</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="comp-select" className="text-xs text-muted font-sans block">
                Which tool reverses the completed action? (Optional)
              </label>
              <select
                id="comp-select"
                value={compensateToolName}
                onChange={(e) => setCompensateToolName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-background border border-white/9 text-foreground font-mono text-xs focus:outline-none focus:border-white/30"
              >
                <option value="" className="bg-panel text-subtle">
                  No automatic compensation (Workflows will require manual attention on rollback)
                </option>
                {tools.map((t) => (
                  <option key={t.name} value={t.name} className="bg-panel text-foreground">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 04: Operation Identity & Compatibility Matrix */}
          <div className="p-5 border border-white/9 bg-panel space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/6 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-foreground border border-white/20 text-xs">
                  04
                </span>
                <span className="font-bold text-foreground">OPERATION IDENTITY</span>
              </div>
              <span className="text-xs text-subtle">CORRELATION PARAMETER</span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="op-field" className="text-xs text-muted font-sans block">
                Shared identity parameter
              </label>
              <input
                id="op-field"
                type="text"
                value={operationKeyField}
                onChange={(e) => setOperationKeyField(e.target.value)}
                placeholder="operationKey, idempotencyKey"
                className="w-full max-w-xs px-3 py-1.5 rounded bg-background border border-white/9 text-amber-300 font-mono text-xs focus:outline-none focus:border-white/30"
                required
              />
            </div>

            {/* Compatibility Matrix */}
            <div className="space-y-2 pt-2 border-t border-white/4">
              <span className="text-xs text-subtle uppercase block">Compatibility Matrix</span>
              <div className="divide-y divide-white/4 border border-white/6 bg-background text-xs">
                <div className="flex items-center justify-between p-2">
                  <span className="text-muted">Execute ({executeToolName || "none"})</span>
                  <span className={execAcceptsKey ? "text-emerald-400 font-bold" : "text-amber-400"}>
                    {execAcceptsKey ? `✓ '${opKey}' compatible` : `✕ missing '${opKey}'`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-muted">Inspect ({inspectToolName || "none"})</span>
                  <span className={inspAcceptsKey ? "text-emerald-400 font-bold" : "text-amber-400"}>
                    {inspAcceptsKey ? `✓ '${opKey}' compatible` : `✕ missing '${opKey}'`}
                  </span>
                </div>
                {hasCompensate && (
                  <div className="flex items-center justify-between p-2">
                    <span className="text-muted">Compensate ({compensateToolName})</span>
                    <span className={compAcceptsKey ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      {compAcceptsKey ? `✓ '${opKey}' compatible` : `✕ missing '${opKey}'`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Developer Assertions */}
          <div className="p-5 border border-white/9 bg-panel space-y-4 font-mono text-xs">
            <div className="text-xs text-subtle uppercase tracking-wider border-b border-white/6 pb-2">
              DEVELOPER ASSERTIONS
            </div>

            <div className="space-y-3 font-sans text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={executeIdempotent}
                  onChange={(e) => setExecuteIdempotent(e.target.checked)}
                  className="mt-1 rounded bg-background border-white/20 text-accent-lime focus:ring-0"
                />
                <span className="text-muted leading-relaxed">
                  <strong className="text-foreground">Execute Idempotency:</strong> The execute action (<code className="font-mono text-emerald-400">{executeToolName}</code>) binds to the operation identity without creating duplicate mutations.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inspectAuthoritative}
                  onChange={(e) => setInspectAuthoritative(e.target.checked)}
                  className="mt-1 rounded bg-background border-white/20 text-accent-lime focus:ring-0"
                />
                <span className="text-muted leading-relaxed">
                  <strong className="text-foreground">Authoritative Ground Truth:</strong> Inspect (<code className="font-mono text-cyan-300">{inspectToolName}</code>) reflects actual target application state for this identity.
                </span>
              </label>

              {hasCompensate && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={compensateRetrySafe}
                    onChange={(e) => setCompensateRetrySafe(e.target.checked)}
                    className="mt-1 rounded bg-background border-white/20 text-accent-lime focus:ring-0"
                  />
                  <span className="text-muted leading-relaxed">
                    <strong className="text-foreground">Safe Compensation:</strong> Compensation (<code className="font-mono text-amber-300">{compensateToolName}</code>) is safe to retry and idempotently removes the resource.
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT RAIL (~32%) — LIVE CONTRACT READINESS PANEL */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          <div className="p-5 border border-white/9 bg-panel font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-white/6 pb-2">
              <span className="text-xs text-subtle uppercase tracking-wider">
                CONTRACT READINESS
              </span>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${isReady
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-950/60 text-amber-300 border-amber-500/40"
                  }`}
              >
                {isReady ? "READY" : "NEEDS REVIEW"}
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Execute tool selected</span>
                <span className={executeToolName ? "text-emerald-400" : "text-subtle"}>
                  {executeToolName ? "✓" : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Inspect tool selected</span>
                <span className={inspectToolName ? "text-emerald-400" : "text-subtle"}>
                  {inspectToolName ? "✓" : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Compensation handler</span>
                <span className={hasCompensate ? "text-emerald-400" : "text-subtle"}>
                  {hasCompensate ? "✓ Configured" : "None (Optional)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Identity parameter</span>
                <span className={execAcceptsKey && inspAcceptsKey ? "text-emerald-400" : "text-amber-400"}>
                  {execAcceptsKey && inspAcceptsKey ? "✓ Validated" : "⚠ Check matrix"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Developer assertions</span>
                <span className={assertionsValid ? "text-emerald-400" : "text-amber-400"}>
                  {assertionsValid ? "✓ Confirmed" : "⚠ Pending"}
                </span>
              </div>
            </div>

            {/* Issues List */}
            {validationIssues.length > 0 && (
              <div className="pt-3 border-t border-white/4 space-y-1.5">
                <span className="text-xs text-amber-400 uppercase block">
                  {validationIssues.length} {validationIssues.length === 1 ? "issue" : "issues"} to resolve:
                </span>
                <ul className="space-y-1 text-xs text-muted font-sans">
                  {validationIssues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400">×</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-white/6 flex items-center justify-between gap-3">
              <Link
                href={`/app/services/${id}`}
                className="px-3 py-2 text-subtle hover:text-foreground font-mono text-xs transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded bg-foreground text-background hover:bg-white font-semibold font-mono text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isSaving ? "Saving…" : "Save contract"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
