"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/services/AppNav";
import { useWorkflows } from "@/hooks/useWorkflows";
import type { ConnectedServiceRecord, ReliabilityContractRecord } from "@/lib/db";

interface StepFormItem {
  id: string;
  stepKey: string;
  label: string;
  contractId: string;
  dependencies: string[];
  staticInputs: Record<string, string>;
  dependencyInputs: Record<string, { stepId: string; field: string }>;
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const { createNewWorkflow } = useWorkflows();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState<ConnectedServiceRecord[]>([]);
  const [contractsByService, setContractsByService] = useState<
    Record<string, ReliabilityContractRecord[]>
  >({});
  const [loading, setLoading] = useState(true);

  const [steps, setSteps] = useState<StepFormItem[]>([
    {
      id: "step_1",
      stepKey: "step-1",
      label: "Step 1",
      contractId: "",
      dependencies: [],
      staticInputs: {},
      dependencyInputs: {},
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const srvRes = await fetch("/api/services");
        if (!srvRes.ok) throw new Error("Failed to load services");
        const srvData = await srvRes.json();
        const loadedServices: ConnectedServiceRecord[] = srvData.services || [];
        setServices(loadedServices);

        const contractsMap: Record<string, ReliabilityContractRecord[]> = {};
        for (const s of loadedServices) {
          const ctrRes = await fetch(`/api/services/${encodeURIComponent(s.id)}/contracts`);
          if (ctrRes.ok) {
            const ctrData = await ctrRes.json();
            contractsMap[s.id] = (ctrData.contracts || []).filter(
              (c: ReliabilityContractRecord) => c.status === "READY"
            );
          }
        }
        setContractsByService(contractsMap);

        const firstService = loadedServices[0];
        if (firstService && contractsMap[firstService.id]?.length > 0) {
          const firstContract = contractsMap[firstService.id][0];
          setSteps([
            {
              id: "step_1",
              stepKey: firstContract.name.toLowerCase().replace(/\s+/g, "-"),
              label: firstContract.name,
              contractId: firstContract.id,
              dependencies: [],
              staticInputs: {},
              dependencyInputs: {},
            },
          ]);
        }
      } catch (err: unknown) {
        console.error("[mcpx-workflow-new] load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const allAvailableContracts: Array<{
    service: ConnectedServiceRecord;
    contract: ReliabilityContractRecord;
  }> = [];

  for (const s of services) {
    const list = contractsByService[s.id] || [];
    for (const c of list) {
      allAvailableContracts.push({ service: s, contract: c });
    }
  }

  const handleAddStep = () => {
    const newIdx = steps.length + 1;
    const defaultContract = allAvailableContracts[0]?.contract;
    setSteps([
      ...steps,
      {
        id: `step_${Date.now()}`,
        stepKey: defaultContract
          ? `${defaultContract.name.toLowerCase().replace(/\s+/g, "-")}-${newIdx}`
          : `step-${newIdx}`,
        label: defaultContract?.name || `Step ${newIdx}`,
        contractId: defaultContract?.id || "",
        dependencies: steps.length > 0 ? [steps[steps.length - 1].stepKey] : [],
        staticInputs: {},
        dependencyInputs: {},
      },
    ]);
  };

  const handleRemoveStep = (idx: number) => {
    if (steps.length <= 1) return;
    const toRemoveKey = steps[idx].stepKey;
    const filtered = steps.filter((_, i) => i !== idx);
    const updated = filtered.map((s) => ({
      ...s,
      dependencies: s.dependencies.filter((d) => d !== toRemoveKey),
    }));
    setSteps(updated);
  };

  const hasCycle = (): boolean => {
    const adj = new Map<string, string[]>();
    for (const s of steps) {
      adj.set(s.stepKey, s.dependencies);
    }
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function dfs(curr: string): boolean {
      visited.add(curr);
      recStack.add(curr);
      const neighbors = adj.get(curr) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
      recStack.delete(curr);
      return false;
    }

    for (const s of steps) {
      if (!visited.has(s.stepKey)) {
        if (dfs(s.stepKey)) return true;
      }
    }
    return false;
  };

  const isCyclic = hasCycle();
  const allContractsSelected = steps.every((s) => Boolean(s.contractId));
  const isFormValid = Boolean(name.trim()) && steps.length > 0 && allContractsSelected && !isCyclic;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const workflow = await createNewWorkflow({
        name: name.trim(),
        description: description.trim() || undefined,
        nodes: steps.map((s) => ({
          stepKey: s.stepKey,
          label: s.label,
          contractId: s.contractId,
          dependencies: s.dependencies,
          inputConfig: {
            ...Object.fromEntries(
              Object.entries(s.staticInputs).map(([k, v]) => [
                k,
                { type: "static", value: v },
              ])
            ),
            ...Object.fromEntries(
              Object.entries(s.dependencyInputs).map(([k, v]) => [
                k,
                { type: "dependency_output", stepId: v.stepId, field: v.field },
              ])
            ),
          },
        })),
      });

      router.push(`/app/workflows/${encodeURIComponent(workflow.id)}`);
    } catch (err: unknown) {
      console.error("[mcpx-workflow-new] save error:", err);
      setIsSaving(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to create workflow");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <AppNav />
          <div className="py-12 text-center text-xs text-slate-500">
            Loading services and contracts…
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
              href="/app/workflows"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Workflows
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans">
            Create workflow
          </h1>
          <p className="text-xs text-slate-400">
            Compose reliability contracts into a multi-step DAG transaction.
          </p>
        </div>

        {allAvailableContracts.length === 0 ? (
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-300 space-y-3">
            <h2 className="font-semibold text-sm">No READY contracts available</h2>
            <p className="text-slate-300 leading-relaxed">
              Workflows require at least one configured, ready reliability contract. Please connect a WebMCP service and create a reliability contract first.
            </p>
            <Link
              href="/app/services"
              className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-500 transition-colors"
            >
              Go to Services →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Workflow Info */}
            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="wf-name" className="text-xs font-medium text-slate-300 block">
                  Workflow name <span className="text-indigo-400">*</span>
                </label>
                <input
                  id="wf-name"
                  type="text"
                  placeholder="e.g. Customer Onboarding, Widget Publishing, Order Settlement"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-sans text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="wf-desc" className="text-xs font-medium text-slate-300 block">
                  Description <span className="text-slate-500 text-[11px]">(optional)</span>
                </label>
                <input
                  id="wf-desc"
                  type="text"
                  placeholder="Brief description of this consequential workflow"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-sans text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Steps Builder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Workflow steps ({steps.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  + Add step
                </button>
              </div>

              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-300">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {step.label || `Step ${idx + 1}`}
                        </span>
                      </div>

                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-300 block">
                          Step label
                        </label>
                        <input
                          type="text"
                          value={step.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...steps];
                            updated[idx].label = val;
                            setSteps(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-sans text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-300 block">
                          Reliability contract
                        </label>
                        <select
                          value={step.contractId}
                          onChange={(e) => {
                            const contractId = e.target.value;
                            const contractItem = allAvailableContracts.find((c) => c.contract.id === contractId);
                            const updated = [...steps];
                            updated[idx].contractId = contractId;
                            if (contractItem) {
                              updated[idx].label = contractItem.contract.name;
                            }
                            setSteps(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-sans text-indigo-300 focus:outline-none focus:border-indigo-500"
                          required
                        >
                          {allAvailableContracts.map(({ service, contract }) => (
                            <option
                              key={contract.id}
                              value={contract.id}
                              className="text-slate-200 bg-slate-900"
                            >
                              {service.name} / {contract.name} ({contract.executeToolName})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dependencies Multi-Select */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/40 text-xs">
                      <span className="text-[11px] font-medium text-slate-400 block">
                        Depends on
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {steps
                          .filter((s) => s.stepKey !== step.stepKey)
                          .map((other) => (
                            <label
                              key={other.stepKey}
                              className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-xs select-none"
                            >
                              <input
                                type="checkbox"
                                checked={step.dependencies.includes(other.stepKey)}
                                onChange={(e) => {
                                  const updated = [...steps];
                                  if (e.target.checked) {
                                    updated[idx].dependencies = [
                                      ...step.dependencies,
                                      other.stepKey,
                                    ];
                                  } else {
                                    updated[idx].dependencies = step.dependencies.filter(
                                      (d) => d !== other.stepKey
                                    );
                                  }
                                  setSteps(updated);
                                }}
                                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                              />
                              <span>{other.label}</span>
                            </label>
                          ))}

                        {steps.length === 1 && (
                          <span className="text-[11px] text-slate-500">
                            Root step (no dependencies)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Summary Card */}
            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Workflow validation
                </span>
                <span
                  className={`text-xs font-mono px-2.5 py-0.5 rounded border ${
                    isFormValid
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  }`}
                >
                  {isFormValid ? "READY TO RUN" : "NEEDS ATTENTION"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Step count</span>
                  <span className="text-emerald-400">✓ {steps.length} step{steps.length > 1 ? "s" : ""}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Graph acyclic</span>
                  <span className={isCyclic ? "text-rose-400 font-medium" : "text-emerald-400"}>
                    {isCyclic ? "✕ Dependency cycle detected" : "✓ No cycles"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reliability contracts</span>
                  <span className={allContractsSelected ? "text-emerald-400" : "text-amber-400"}>
                    {allContractsSelected ? "✓ All contracts ready" : "⚠ Incomplete contract selection"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Compiles into MCPx transaction DAG with uncertainty recovery & Saga rollback.
                </span>
                <button
                  type="submit"
                  disabled={!isFormValid || isSaving}
                  className="px-5 py-2.5 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving…" : "Save workflow"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
