import WebMCPProof from "@/components/WebMCPProof";
import Link from "next/link";
import AppNav from "@/components/services/AppNav";

export default function AppPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* App Navigation */}
        <AppNav />

        {/* Reference Workflow Header */}
        <header className="border-b border-slate-800/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Reference deployment workflow
              </h1>
              <span className="text-xs text-slate-400 font-medium">
                4 sample WebMCP services
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Demonstrating cross-origin execution, lost ACK uncertainty recovery (<code className="text-amber-300 font-mono">IN_DOUBT</code> → <code className="text-emerald-300 font-mono">RECOVERED</code>), and human-approved reverse Saga compensation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              4 reference services
            </span>
            <Link
              href="/app/services"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:text-white text-[11px] transition-colors"
            >
              + Connect your service
            </Link>
          </div>
        </header>

        {/* Operational Dashboard */}
        <main>
          <WebMCPProof />
        </main>
      </div>
    </div>
  );
}
