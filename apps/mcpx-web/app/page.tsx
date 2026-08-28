import WebMCPProof from "@/components/WebMCPProof";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Clean Infrastructure Header */}
        <header className="border-b border-slate-800/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                M
              </div>
              <div className="flex items-baseline gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  MCPx
                </h1>
                <span className="text-xs text-slate-400 font-medium">
                  Reliable execution for WebMCP workflows
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Recover uncertain actions and safely roll back failed multi-app workflows.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              4 services connected
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
              Durable state
            </span>
          </div>
        </header>

        {/* Main Application */}
        <main>
          <WebMCPProof />
        </main>
      </div>
    </div>
  );
}
