"use client";

import type { ConnectedServiceRecord, ReliabilityContractRecord } from "@/lib/db";

export interface StepFormItem {
  id: string;
  stepKey: string;
  label: string;
  contractId: string;
  dependencies: string[];
  staticInputs: Record<string, string>;
  dependencyInputs: Record<string, { stepId: string; field: string }>;
}

interface WorkflowStepBuilderProps {
  steps: StepFormItem[];
  setSteps: React.Dispatch<React.SetStateAction<StepFormItem[]>>;
  allAvailableContracts: Array<{
    service: ConnectedServiceRecord;
    contract: ReliabilityContractRecord;
  }>;
  onAddStep: () => void;
  onRemoveStep: (idx: number) => void;
}

export default function WorkflowStepBuilder({
  steps,
  setSteps,
  allAvailableContracts,
  onAddStep,
  onRemoveStep,
}: WorkflowStepBuilderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
        <h2 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
          Workflow Steps ({steps.length})
        </h2>
        <button
          type="button"
          onClick={onAddStep}
          className="px-3 py-1 rounded bg-white/4 hover:bg-white/8 border border-white/9 text-foreground font-mono text-xs transition-colors cursor-pointer"
        >
          + Add step
        </button>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className="p-5 border border-white/9 bg-panel space-y-4 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded bg-background border border-white/10 flex items-center justify-center font-mono text-xs text-accent-lime font-bold">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-foreground font-sans">
                  {step.label || `Step ${idx + 1}`}
                </span>
              </div>

              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveStep(idx)}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-subtle uppercase block">
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
                  className="w-full px-3 py-1.5 rounded bg-background border border-white/9 text-xs font-sans text-foreground focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-subtle uppercase block">
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
                  className="w-full px-3 py-1.5 rounded bg-background border border-white/9 text-xs font-mono text-cyan-300 focus:outline-none focus:border-white/30"
                  required
                >
                  {allAvailableContracts.map(({ service, contract }) => (
                    <option
                      key={contract.id}
                      value={contract.id}
                      className="text-foreground bg-panel"
                    >
                      {service.name} / {contract.name} ({contract.executeToolName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dependencies Selection */}
            <div className="space-y-2 pt-2 border-t border-white/4">
              <span className="text-xs font-mono text-subtle uppercase block">
                Depends on
              </span>
              <div className="flex flex-wrap gap-3">
                {steps
                  .filter((s) => s.stepKey !== step.stepKey)
                  .map((other) => (
                    <label
                      key={other.stepKey}
                      className="flex items-center gap-1.5 cursor-pointer text-muted text-xs select-none font-mono"
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
                        className="rounded bg-background border-white/20 text-accent-lime focus:ring-0"
                      />
                      <span>{other.label}</span>
                    </label>
                  ))}

                {steps.length === 1 && (
                  <span className="text-xs text-subtle font-mono">
                    Root step (no dependencies)
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
