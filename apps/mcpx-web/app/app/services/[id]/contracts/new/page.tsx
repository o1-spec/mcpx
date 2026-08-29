"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ContractFormSteps from "@/components/contracts/ContractFormSteps";
import ContractReadinessRail from "@/components/contracts/ContractReadinessRail";
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
        <div className="w-4 h-4 border-2 border-white/20 border-t-accent-lime rounded-full animate-spin mx-auto" />
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
          <ContractFormSteps
            name={name}
            setName={setName}
            tools={tools}
            executeToolName={executeToolName}
            setExecuteToolName={setExecuteToolName}
            inspectToolName={inspectToolName}
            setInspectToolName={setInspectToolName}
            compensateToolName={compensateToolName}
            setCompensateToolName={setCompensateToolName}
            operationKeyField={operationKeyField}
            setOperationKeyField={setOperationKeyField}
            executeIdempotent={executeIdempotent}
            setExecuteIdempotent={setExecuteIdempotent}
            inspectAuthoritative={inspectAuthoritative}
            setInspectAuthoritative={setInspectAuthoritative}
            compensateRetrySafe={compensateRetrySafe}
            setCompensateRetrySafe={setCompensateRetrySafe}
            execAcceptsKey={execAcceptsKey}
            inspAcceptsKey={inspAcceptsKey}
            compAcceptsKey={compAcceptsKey}
            hasCompensate={hasCompensate}
            opKey={opKey}
            execTool={execTool}
            inspTool={inspTool}
            execProps={execProps}
            inspProps={inspProps}
          />
        </div>

        {/* RIGHT RAIL (~32%) — LIVE CONTRACT READINESS PANEL */}
        <div className="lg:col-span-4 space-y-5">
          <ContractReadinessRail
            serviceId={id}
            isReady={isReady}
            executeToolName={executeToolName}
            inspectToolName={inspectToolName}
            hasCompensate={hasCompensate}
            execAcceptsKey={execAcceptsKey}
            inspAcceptsKey={inspAcceptsKey}
            assertionsValid={assertionsValid}
            validationIssues={validationIssues}
            isSaving={isSaving}
          />
        </div>
      </form>
    </div>
  );
}
