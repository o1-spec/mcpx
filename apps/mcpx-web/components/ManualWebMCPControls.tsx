"use client";

interface ManualWebMCPControlsProps {
  operationKey: string;
  projectName: string;
  targetUrl: string;
  onOperationKeyChange: (val: string) => void;
  onProjectNameChange: (val: string) => void;
  onTargetUrlChange: (val: string) => void;
  onCreateRoute: () => void;
  onInspectRoute: () => void;
  onDeleteRoute: () => void;
  lastResult: string | null;
  onClearResult: () => void;
  executingTool: string | null;
}

export default function ManualWebMCPControls({
  operationKey,
  projectName,
  targetUrl,
  onOperationKeyChange,
  onProjectNameChange,
  onTargetUrlChange,
  onCreateRoute,
  onInspectRoute,
  onDeleteRoute,
  lastResult,
  onClearResult,
  executingTool,
}: ManualWebMCPControlsProps) {
  return (
    <section className="space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-200">
          Manual WebMCP Controls (Day-1 Proof)
        </h3>
        <p className="text-xs text-slate-400">
          Direct interactive invocation of <code className="text-cyan-300">create_route</code>, <code className="text-cyan-300">get_route</code>, and <code className="text-cyan-300">delete_route</code>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Action Buttons */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
              Route Parameters
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Operation Key
                </label>
                <input
                  type="text"
                  value={operationKey}
                  onChange={(e) => onOperationKeyChange(e.target.value)}
                  placeholder="tx:demo-001:routing:create"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => onProjectNameChange(e.target.value)}
                  placeholder="mcpx-demo"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target
                </label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => onTargetUrlChange(e.target.value)}
                  placeholder="http://localhost:4000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={onCreateRoute}
                disabled={executingTool !== null}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {executingTool === "create_route" ? (
                  <span>Executing create_route...</span>
                ) : (
                  <span>[ CREATE ROUTE ]</span>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={onInspectRoute}
                  disabled={executingTool !== null}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {executingTool === "get_route" ? (
                    <span>Inspecting...</span>
                  ) : (
                    <span>[ INSPECT ROUTE ]</span>
                  )}
                </button>

                <button
                  onClick={onDeleteRoute}
                  disabled={executingTool !== null}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {executingTool === "delete_route" ? (
                    <span>Deleting...</span>
                  ) : (
                    <span>[ DELETE ROUTE ]</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Last WebMCP Result (Normalized) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Last WebMCP Result (Normalized)
              </h3>
              {lastResult && (
                <button
                  onClick={onClearResult}
                  className="text-xs text-slate-500 hover:text-slate-400 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[220px] rounded-xl border border-slate-800/80 bg-slate-950 p-4 font-mono text-xs overflow-auto">
              {lastResult ? (
                <pre className="text-emerald-400 whitespace-pre-wrap break-words">
                  {lastResult}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic">
                  No tool executed yet. Click one of the action buttons to trigger WebMCP execution.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
