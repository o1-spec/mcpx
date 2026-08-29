"use client";

import WebMCPRegistrar from "@/components/WebMCPRegistrar";

export default function ExampleExternalServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 sm:p-10 selection:bg-accent-lime selection:text-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="border-b border-white/8 pb-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Example External WebMCP Service
              </h1>
            </div>
            <p className="text-xs text-muted">
              Generic third-party test fixture for MCPx dynamic service onboarding
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-panel border border-white/9 text-xs font-mono text-muted">
            Port 3010
          </span>
        </header>

        <section className="space-y-2">
          <span className="text-xs font-mono text-subtle uppercase tracking-wider block">
            WebMCP STATUS
          </span>
          <WebMCPRegistrar />
        </section>

        <div className="border border-white/9 bg-panel p-5 space-y-3 font-mono text-xs">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider block border-b border-white/6 pb-2">
            EXPOSED WEBMCP TOOLS (9)
          </span>

          <div className="space-y-2 text-xs">
            <div className="p-3 border border-white/6 bg-background flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-medium">ping_service</span>
                <p className="text-xs text-muted font-sans">Check service availability</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/6 text-muted">READ</span>
            </div>

            <div className="p-3 border border-white/6 bg-background flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-medium">get_status</span>
                <p className="text-xs text-muted font-sans">Retrieve runtime health and uptime</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/6 text-muted">READ</span>
            </div>

            <div className="p-3 border border-white/6 bg-background flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-medium">create_widget</span>
                <p className="text-xs text-muted font-sans">Create widget with idempotent operationKey</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/6 text-amber-300">MUTATION</span>
            </div>

            <div className="p-3 border border-white/6 bg-background flex items-center justify-between">
              <div>
                <span className="font-mono text-cyan-300 font-medium">get_widget</span>
                <p className="text-xs text-muted font-sans">Authoritative inspection of widget</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/6 text-cyan-300">INSPECT</span>
            </div>

            <div className="p-3 border border-white/6 bg-background flex items-center justify-between">
              <div>
                <span className="font-mono text-amber-300 font-medium">delete_widget</span>
                <p className="text-xs text-muted font-sans">Idempotent compensation of widget</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/6 text-amber-300">COMPENSATE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
