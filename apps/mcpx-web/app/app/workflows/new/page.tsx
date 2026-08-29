"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WorkflowStepBuilder, { type StepFormItem } from "@/components/workflows/WorkflowStepBuilder";
import WorkflowValidationRail from "@/components/workflows/WorkflowValidationRail";
import { useWorkflows } from "@/hooks/useWorkflows";
import type { ConnectedServiceRecord, ReliabilityContractRecord } from "@/lib/db";

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
      <div className="py-20 text-center font-mono text-xs text-subtle space-y-2">
        <div className="w-4 h-4 border-2 border-white/20 border-t-accent-lime rounded-full animate-spin mx-auto" />
        <div>Loading services and contracts…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="space-y-2 border-b border-white/8 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-subtle">
          <Link href="/app/workflows" className="hover:text-foreground transition-colors">
            Workflows
          </Link>
          <span>/</span>
          <span className="text-muted">New Workflow</span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight font-sans">
            Create Workflow
          </h1>
          <p className="text-xs text-muted font-sans mt-0.5">
            Compose reliability contracts into a multi-step DAG transaction.
          </p>
        </div>
      </div>

      {allAvailableContracts.length === 0 ? (
        <div className="p-6 border border-amber-500/30 bg-amber-950/20 font-mono text-xs text-amber-300 space-y-3">
          <div className="font-bold uppercase">[ NO READY CONTRACTS AVAILABLE ]</div>
          <p className="text-muted font-sans text-xs leading-relaxed">
            Workflows require at least one configured, ready reliability contract. Please connect a WebMCP service and create a reliability contract first.
          </p>
          <Link
            href="/app/services"
            className="inline-block px-3.5 py-1.5 rounded bg-foreground text-background font-bold text-xs transition-colors"
          >
            Go to Services →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Main Form (~68%) */}
          <div className="lg:col-span-8 space-y-6">
            {errorMessage && (
              <div className="p-3 border border-rose-500/40 bg-rose-950/20 font-mono text-xs text-rose-300">
                ✕ {errorMessage}
              </div>
            )}

            {/* Workflow Identity */}
            <div className="p-5 border border-white/9 bg-panel space-y-4 font-mono text-xs">
              <div className="text-xs text-subtle uppercase tracking-wider border-b border-white/6 pb-2">
                WORKFLOW IDENTITY
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="wf-name" className="text-xs font-medium text-foreground block font-sans">
                    Workflow name <span className="text-accent-lime">*</span>
                  </label>
                  <input
                    id="wf-name"
                    type="text"
                    placeholder="e.g. Customer Onboarding, Widget Publishing, Order Settlement"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-background border border-white/9 text-xs font-sans text-foreground placeholder-subtle focus:outline-none focus:border-white/30"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="wf-desc" className="text-xs font-medium text-muted block font-sans">
                    Description <span className="text-subtle text-xs">(optional)</span>
                  </label>
                  <input
                    id="wf-desc"
                    type="text"
                    placeholder="Brief description of this consequential workflow"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-background border border-white/9 text-xs font-sans text-foreground placeholder-subtle focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            {/* Steps Builder */}
            <WorkflowStepBuilder
              steps={steps}
              setSteps={setSteps}
              allAvailableContracts={allAvailableContracts}
              onAddStep={handleAddStep}
              onRemoveStep={handleRemoveStep}
            />
          </div>

          {/* Right Rail Validation Summary (~32%) */}
          <div className="lg:col-span-4 space-y-5">
            <WorkflowValidationRail
              isFormValid={isFormValid}
              stepCount={steps.length}
              isCyclic={isCyclic}
              allContractsSelected={allContractsSelected}
              isSaving={isSaving}
            />
          </div>
        </form>
      )}
    </div>
  );
}
