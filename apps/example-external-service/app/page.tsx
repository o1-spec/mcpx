"use client";

import WebMCPRegistrar from "@/components/WebMCPRegistrar";

export default function ExampleExternalServicePage() {
  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F5F3] font-sans p-6 sm:p-10 selection:bg-[#A5F36B] selection:text-[#070708]">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="border-b border-white/[0.08] pb-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
              <h1 className="text-[20px] font-bold tracking-tight text-[#F5F5F3] font-sans">
                Example External WebMCP Service
              </h1>
            </div>
            <p className="text-[12.5px] text-[#A0A0A4]">
              Generic third-party test fixture for MCPx dynamic service onboarding
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-[#0B0C0E] border border-white/[0.09] text-[12px] font-mono text-[#A0A0A4]">
            Port 3010
          </span>
        </header>

        <section className="space-y-2">
          <span className="text-[11px] font-mono text-[#66686D] uppercase tracking-wider block">
            WebMCP STATUS
          </span>
          <WebMCPRegistrar />
        </section>

        <div className="border border-white/[0.09] bg-[#0B0C0E] p-5 space-y-3 font-mono text-[12px]">
          <span className="text-[11px] font-bold text-[#F5F5F3] uppercase tracking-wider block border-b border-white/[0.06] pb-2">
            EXPOSED WEBMCP TOOLS (9)
          </span>

          <div className="space-y-2 text-[12px]">
            <div className="p-3 border border-white/[0.06] bg-[#070708] flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-medium">ping_service</span>
                <p className="text-[11px] text-[#A0A0A4] font-sans">Check service availability</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-[#A0A0A4]">READ</span>
            </div>

            <div className="p-3 border border-white/[0.06] bg-[#070708] flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-medium">get_status</span>
                <p className="text-[11px] text-[#A0A0A4] font-sans">Retrieve runtime health and uptime</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-[#A0A0A4]">READ</span>
            </div>

            <div className="p-3 border border-white/[0.06] bg-[#070708] flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-medium">create_widget</span>
                <p className="text-[11px] text-[#A0A0A4] font-sans">Create widget with idempotent operationKey</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-amber-300">MUTATION</span>
            </div>

            <div className="p-3 border border-white/[0.06] bg-[#070708] flex items-center justify-between">
              <div>
                <span className="font-mono text-cyan-300 font-medium">get_widget</span>
                <p className="text-[11px] text-[#A0A0A4] font-sans">Authoritative inspection of widget</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-cyan-300">INSPECT</span>
            </div>

            <div className="p-3 border border-white/[0.06] bg-[#070708] flex items-center justify-between">
              <div>
                <span className="font-mono text-amber-300 font-medium">delete_widget</span>
                <p className="text-[11px] text-[#A0A0A4] font-sans">Idempotent compensation of widget</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-amber-300">COMPENSATE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
