"use client";

import WebMCPRegistrar from "@/components/WebMCPRegistrar";

export default function ExampleExternalServicePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="border-b border-slate-800 pb-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
              <h1 className="text-xl font-semibold tracking-tight text-white font-sans">
                Example External WebMCP Service
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Generic third-party test fixture for MCPx dynamic service onboarding
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
            Port 3010
          </span>
        </header>

        <WebMCPRegistrar />

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 space-y-3">
          <span className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
            Exposed WebMCP Tools (3)
          </span>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-slate-800/60 bg-slate-950/60 flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-medium">ping_service</span>
                <p className="text-[11px] text-slate-400">Check service availability</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">READ</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-800/60 bg-slate-950/60 flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-medium">get_status</span>
                <p className="text-[11px] text-slate-400">Retrieve runtime health and uptime</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">READ</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-800/60 bg-slate-950/60 flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-medium">echo_message</span>
                <p className="text-[11px] text-slate-400">Echo message with timestamp</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">MUTATION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
