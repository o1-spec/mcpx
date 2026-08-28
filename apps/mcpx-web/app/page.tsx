import WebMCPProof from "@/components/WebMCPProof";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
                M
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                MCPx — WebMCP Proof
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Cross-origin browser-level Model Context Protocol proof-of-concept
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              Host: localhost:3000
            </span>
          </div>
        </header>

        {/* Main Proof Component */}
        <main>
          <WebMCPProof />
        </main>
      </div>
    </div>
  );
}
