"use client";

import type { DiscoveredToolSchema } from "@/hooks/useConnectedServices";

interface ContractFormStepsProps {
  name: string;
  setName: (v: string) => void;
  tools: DiscoveredToolSchema[];
  executeToolName: string;
  setExecuteToolName: (v: string) => void;
  inspectToolName: string;
  setInspectToolName: (v: string) => void;
  compensateToolName: string;
  setCompensateToolName: (v: string) => void;
  operationKeyField: string;
  setOperationKeyField: (v: string) => void;
  executeIdempotent: boolean;
  setExecuteIdempotent: (v: boolean) => void;
  inspectAuthoritative: boolean;
  setInspectAuthoritative: (v: boolean) => void;
  compensateRetrySafe: boolean;
  setCompensateRetrySafe: (v: boolean) => void;
  execAcceptsKey: boolean;
  inspAcceptsKey: boolean;
  compAcceptsKey: boolean;
  hasCompensate: boolean;
  opKey: string;
  execTool?: DiscoveredToolSchema;
  inspTool?: DiscoveredToolSchema;
  execProps: Record<string, { type?: string }>;
  inspProps: Record<string, { type?: string }>;
}

export default function ContractFormSteps({
  name,
  setName,
  tools,
  executeToolName,
  setExecuteToolName,
  inspectToolName,
  setInspectToolName,
  compensateToolName,
  setCompensateToolName,
  operationKeyField,
  setOperationKeyField,
  executeIdempotent,
  setExecuteIdempotent,
  inspectAuthoritative,
  setInspectAuthoritative,
  compensateRetrySafe,
  setCompensateRetrySafe,
  execAcceptsKey,
  inspAcceptsKey,
  compAcceptsKey,
  hasCompensate,
  opKey,
  execTool,
  inspTool,
  execProps,
  inspProps,
}: ContractFormStepsProps) {
  return (
    <div className="space-y-6">
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
  );
}
