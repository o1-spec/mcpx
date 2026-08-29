"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
        stepKey: `step-${newIdx}`,
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
      <div className="py-20 text-center font-mono text-xs text-[#66686D] space-y-2">
        <div className="w-4 h-4 border-2 border-white/20 border-t-[#A5F36B] rounded-full animate-spin mx-auto"></div>
        <div>Loading services and contracts…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="space-y-2 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 text-[12px] font-mono text-[#66686D]">
          <Link href="/app/workflows" className="hover:text-[#F5F5F3] transition-colors">
            Workflows
          </Link>
          <span>/</span>
          <span className="text-[#A0A0A4]">New Workflow</span>
        </div>

        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[#F5F5F3] tracking-tight font-sans">
            Create Workflow
          </h1>
          <p className="text-[13px] text-[#A0A0A4] font-sans mt-0.5">
            Compose reliability contracts into a multi-step DAG transaction.
          </p>
        </div>
      </div>

      {allAvailableContracts.length === 0 ? (
        <div className="p-6 border border-amber-500/30 bg-amber-950/20 font-mono text-[12px] text-amber-300 space-y-3">
          <div className="font-bold uppercase">[ NO READY CONTRACTS AVAILABLE ]</div>
          <p className="text-[#A0A0A4] font-sans text-[13px] leading-relaxed">
            Workflows require at least one configured, ready reliability contract. Please connect a WebMCP service and create a reliability contract first.
          </p>
          <Link
            href="/app/services"
            className="inline-block px-3.5 py-1.5 rounded bg-[#F5F5F3] text-[#070708] font-bold text-[12px] transition-colors"
          >
            Go to Services →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Main Form (~68%) */}
          <div className="lg:col-span-8 space-y-6">
            {errorMessage && (
              <div className="p-3 border border-rose-500/40 bg-rose-950/20 font-mono text-[12px] text-rose-300">
                ✕ {errorMessage}
              </div>
            )}

            {/* Workflow Identity */}
            <div className="p-5 border border-white/[0.09] bg-[#0B0C0E] space-y-4 font-mono text-[12px]">
              <div className="text-[11px] text-[#66686D] uppercase tracking-wider border-b border-white/[0.06] pb-2">
                WORKFLOW IDENTITY
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="wf-name" className="text-[12px] font-medium text-[#F5F5F3] block font-sans">
                    Workflow name <span className="text-[#A5F36B]">*</span>
                  </label>
                  <input
                    id="wf-name"
                    type="text"
                    placeholder="e.g. Customer Onboarding, Widget Publishing, Order Settlement"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#070708] border border-white/[0.09] text-[13px] font-sans text-[#F5F5F3] placeholder-[#66686D] focus:outline-none focus:border-white/30"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="wf-desc" className="text-[12px] font-medium text-[#A0A0A4] block font-sans">
                    Description <span className="text-[#66686D] text-[11px]">(optional)</span>
                  </label>
                  <input
                    id="wf-desc"
                    type="text"
                    placeholder="Brief description of this consequential workflow"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#070708] border border-white/[0.09] text-[13px] font-sans text-[#F5F5F3] placeholder-[#66686D] focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            {/* Steps Builder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <h2 className="text-[13px] font-mono font-bold text-[#F5F5F3] uppercase tracking-wider">
                  Workflow Steps ({steps.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="px-3 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-[#F5F5F3] font-mono text-[11.5px] transition-colors cursor-pointer"
                >
                  + Add step
                </button>
              </div>

              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-5 border border-white/[0.09] bg-[#0B0C0E] space-y-4 font-mono text-[12px]"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-[#070708] border border-white/[0.1] flex items-center justify-center font-mono text-[10.5px] text-[#A5F36B] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-[13px] font-bold text-[#F5F5F3] font-sans">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-[#66686D] uppercase block">
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
                          className="w-full px-3 py-1.5 rounded bg-[#070708] border border-white/[0.09] text-[12px] font-sans text-[#F5F5F3] focus:outline-none focus:border-white/30"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-[#66686D] uppercase block">
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
                          className="w-full px-3 py-1.5 rounded bg-[#070708] border border-white/[0.09] text-[12px] font-mono text-cyan-300 focus:outline-none focus:border-white/30"
                          required
                        >
                          {allAvailableContracts.map(({ service, contract }) => (
                            <option
                              key={contract.id}
                              value={contract.id}
                              className="text-[#F5F5F3] bg-[#0B0C0E]"
                            >
                              {service.name} / {contract.name} ({contract.executeToolName})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dependencies Selection */}
                    <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                      <span className="text-[10.5px] font-mono text-[#66686D] uppercase block">
                        Depends on
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {steps
                          .filter((s) => s.stepKey !== step.stepKey)
                          .map((other) => (
                            <label
                              key={other.stepKey}
                              className="flex items-center gap-1.5 cursor-pointer text-[#A0A0A4] text-[11.5px] select-none font-mono"
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
                                className="rounded bg-[#070708] border-white/20 text-[#A5F36B] focus:ring-0"
                              />
                              <span>{other.label}</span>
                            </label>
                          ))}

                        {steps.length === 1 && (
                          <span className="text-[11px] text-[#66686D] font-mono">
                            Root step (no dependencies)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Rail Validation Summary (~32%) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24 font-mono text-[12px]">
            <div className="p-5 border border-white/[0.09] bg-[#0B0C0E] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[11px] text-[#66686D] uppercase tracking-wider">
                  DAG VALIDATION
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                    isFormValid
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-950/60 text-amber-300 border-amber-500/40"
                  }`}
                >
                  {isFormValid ? "READY TO RUN" : "NEEDS ATTENTION"}
                </span>
              </div>

              <div className="space-y-2 text-[11.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#A0A0A4]">Step count</span>
                  <span className="text-emerald-400">✓ {steps.length} {steps.length > 1 ? "steps" : "step"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#A0A0A4]">Acyclic graph</span>
                  <span className={isCyclic ? "text-rose-400 font-bold" : "text-emerald-400"}>
                    {isCyclic ? "✕ Cycle detected" : "✓ No cycles"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#A0A0A4]">Reliability contracts</span>
                  <span className={allContractsSelected ? "text-emerald-400" : "text-amber-400"}>
                    {allContractsSelected ? "✓ All mapped" : "⚠ Incomplete"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <Link
                  href="/app/workflows"
                  className="px-3 py-2 text-[#66686D] hover:text-[#F5F5F3] font-mono text-[12px] transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!isFormValid || isSaving}
                  className="px-4 py-2 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold font-mono text-[12px] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? "Saving…" : "Save workflow"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
