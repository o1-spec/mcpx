import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Header & Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
              M
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              MCPx
            </span>
          </div>

          <nav className="flex items-center gap-6 text-xs text-slate-400">
            <a
              href="#how-it-works"
              className="hover:text-slate-200 transition-colors hidden sm:inline"
            >
              How it works
            </a>
            <a
              href="#reliability"
              className="hover:text-slate-200 transition-colors hidden sm:inline"
            >
              Reliability
            </a>
            <Link
              href="/app"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer shadow-sm"
            >
              Open app
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 sm:py-24 space-y-24">
        {/* 2. Hero Section */}
        <section className="space-y-8 text-center max-w-3xl mx-auto">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
              Reliability infrastructure for WebMCP
            </span>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Reliable transactions for WebMCP
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Connect WebMCP actions into multi-step workflows that can recover from uncertain writes, reconcile against authoritative state, and safely roll back partial failures.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/app"
              className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              Try the sample workflow
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-5 py-3 rounded-lg font-medium text-xs text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            >
              See how it works
            </a>
          </div>

          <p className="text-xs text-slate-500 font-normal">
            Durable execution · Authoritative reconciliation · Saga compensation
          </p>

          {/* 3. Hero Visual: Product-Native Static DAG Preview */}
          <div className="pt-8">
            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 text-xs">
                <span className="font-medium text-slate-400">
                  Execution preview · Challenge scenario
                </span>
                <span className="text-amber-300 font-mono text-[11px]">
                  Safety gate active
                </span>
              </div>

              {/* Layer 1: Database */}
              <div className="flex justify-center">
                <div className="w-full max-w-xs p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between text-left">
                  <div>
                    <div className="text-xs font-semibold text-white">Database</div>
                    <div className="text-[10px] text-slate-500">PostgreSQL schema</div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    ✓ Created
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="h-4 w-px bg-slate-700"></div>
              </div>

              {/* Layer 2: Backend */}
              <div className="flex justify-center">
                <div className="w-full max-w-xs p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between text-left">
                  <div>
                    <div className="text-xs font-semibold text-white">Backend</div>
                    <div className="text-[10px] text-slate-500">Compute runtime</div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    ✓ Created
                  </span>
                </div>
              </div>

              <div className="flex justify-center items-center gap-24 sm:gap-36">
                <span className="h-4 w-px bg-slate-700 -rotate-25 transform origin-top"></span>
                <span className="h-4 w-px bg-slate-700 rotate-25 transform origin-top"></span>
              </div>

              {/* Layer 3: Routing & Frontend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/10 flex items-center justify-between text-left">
                  <div>
                    <div className="text-xs font-semibold text-white">Routing</div>
                    <div className="text-[10px] text-slate-400">
                      IN_DOUBT → RECONCILING
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-300 font-medium bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    ⚡ Recovered
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/10 flex items-center justify-between text-left">
                  <div>
                    <div className="text-xs font-semibold text-white">Frontend</div>
                    <div className="text-[10px] text-slate-400">
                      Rejected before commit
                    </div>
                  </div>
                  <span className="text-[11px] text-rose-300 font-medium bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                    ✕ Failed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Core Problem Section */}
        <section className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/20 space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              A successful request is not always a known outcome
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              When an agent executes a consequential browser action across independent web apps, a network timeout does not mean the mutation failed. The service may have persisted the resource and only lost the acknowledgement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/50 space-y-1.5">
              <span className="font-semibold text-slate-300 block">Blind retry</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Retrying without idempotency may duplicate resources, trigger double charges, or corrupt state.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/50 space-y-1.5">
              <span className="font-semibold text-slate-300 block">Blind failure</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Assuming failure when a write succeeded creates unmanaged orphan resources across origins.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-1.5">
              <span className="font-semibold text-indigo-300 block">The MCPx path</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Enter an explicit <code className="text-amber-300 font-mono">IN_DOUBT</code> state, query authoritative remote ground truth, and recover without duplicate writes.
              </p>
            </div>
          </div>
        </section>

        {/* 5. How It Works Section */}
        <section id="how-it-works" className="space-y-8 scroll-mt-20">
          <div className="space-y-2">
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider block">
              Workflow architecture
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              How MCPx makes WebMCP workflows reliable
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/30 space-y-2">
              <span className="text-slate-500 font-mono text-[11px]">01</span>
              <h3 className="font-semibold text-sm text-white">Connect actions</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                MCPx coordinates WebMCP tools exposed by participating web applications in the browser.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/30 space-y-2">
              <span className="text-slate-500 font-mono text-[11px]">02</span>
              <h3 className="font-semibold text-sm text-white">Define contracts</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Consequential actions are paired with authoritative inspection tools and compensation handlers.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/30 space-y-2">
              <span className="text-slate-500 font-mono text-[11px]">03</span>
              <h3 className="font-semibold text-sm text-white">Run as a transaction</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                MCPx executes dependencies as a DAG, persisting ordered state transitions durably.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/30 space-y-2">
              <span className="text-slate-500 font-mono text-[11px]">04</span>
              <h3 className="font-semibold text-sm text-white">Recover safely</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Unknown outcomes reconcile against remote state. Downstream failures trigger human-approved rollback.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Reliability Contract Section */}
        <section id="reliability" className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/20 space-y-6 scroll-mt-20">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider block">
              Contract specification
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              A reliability contract for consequential actions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every consequential mutation requires an authoritative inspection path so the coordinator can query ground truth instead of guessing.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 space-y-3">
            <div className="flex items-center justify-between text-slate-500 text-[11px] border-b border-slate-800 pb-2">
              <span>Capability mapping</span>
              <span>TransactionalToolContract</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div><span className="text-slate-500">Service:</span> <span className="text-indigo-300">Routing</span></div>
              <div><span className="text-slate-500">Execute:</span> <span className="text-emerald-400">create_route</span></div>
              <div><span className="text-slate-500">Inspect:</span> <span className="text-cyan-400">get_route</span></div>
              <div><span className="text-slate-500">Compensate:</span> <span className="text-rose-400">delete_route</span></div>
              <div><span className="text-slate-500">Operation identity:</span> <span className="text-amber-300">operationKey</span></div>
            </div>
          </div>
        </section>

        {/* 7. Included Reference Workflow Section */}
        <section className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider block">
              Reference implementation
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Included reference workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              The included reference workflow uses four independent WebMCP applications to demonstrate cross-origin execution, uncertainty recovery, and rollback.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-xs text-slate-400">
              <span className="font-semibold text-white text-sm block">
                4-Service Deployment DAG
              </span>
              <p>
                Database (PostgreSQL schema) → Backend (Compute runtime) → (Routing gateway ∥ Frontend preview).
              </p>
            </div>

            <Link
              href="/app"
              className="px-5 py-2.5 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              Run the reference workflow →
            </Link>
          </div>
        </section>

        {/* 8. Failure Story Section */}
        <section className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider block">
              Failure handling
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              What happens when the happy path breaks?
            </h2>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4 text-xs">
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
              <div className="relative">
                <span className="absolute -left-6.75 top-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="font-medium text-white">1. Database schema created & backend deployed</span>
              </div>

              <div className="relative">
                <span className="absolute -left-6.75 top-1 h-2 w-2 rounded-full bg-amber-400"></span>
                <div>
                  <span className="font-medium text-amber-300">2. Routing action commits, but response ACK is lost</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    MCPx transitions node to IN_DOUBT instead of blindly retrying.
                  </p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-6.75 top-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                <div>
                  <span className="font-medium text-emerald-400">3. Authoritative inspection confirms route exists</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Node becomes RECOVERED without performing a duplicate write.
                  </p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-6.75 top-1 h-2 w-2 rounded-full bg-rose-400"></span>
                <div>
                  <span className="font-medium text-rose-300">4. Frontend deployment fails before commit</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    MCPx halts the workflow and triggers human approval before rollback.
                  </p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-6.75 top-1 h-2 w-2 rounded-full bg-slate-400"></span>
                <div>
                  <span className="font-medium text-slate-200">5. Reverse Saga compensation</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Routing → Backend → Database are removed in reverse order and verified absent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Product Capabilities */}
        <section className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider block">
              Core runtime
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Product capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-800/70 bg-slate-900/30 space-y-1">
              <h3 className="font-semibold text-white">Cross-origin WebMCP execution</h3>
              <p className="text-slate-400 text-[11px]">Coordinates tools across isolated browser origins safely.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/70 bg-slate-900/30 space-y-1">
              <h3 className="font-semibold text-white">Durable transaction state</h3>
              <p className="text-slate-400 text-[11px]">Every state transition and event is persisted atomically.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/70 bg-slate-900/30 space-y-1">
              <h3 className="font-semibold text-white">Authoritative reconciliation</h3>
              <p className="text-slate-400 text-[11px]">Queries remote application state to resolve uncertain writes.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/70 bg-slate-900/30 space-y-1">
              <h3 className="font-semibold text-white">Dependency-aware DAG execution</h3>
              <p className="text-slate-400 text-[11px]">Executes dependent and parallel steps dynamically.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/70 bg-slate-900/30 space-y-1">
              <h3 className="font-semibold text-white">Human-approved Saga compensation</h3>
              <p className="text-slate-400 text-[11px]">Rolls back partial state in reverse dependency order.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/70 bg-slate-900/30 space-y-1">
              <h3 className="font-semibold text-white">Crash / refresh recovery</h3>
              <p className="text-slate-400 text-[11px]">Rehydrates from durable store and resumes reconciliation.</p>
            </div>
          </div>
        </section>

        {/* 10. Final CTA */}
        <section className="p-8 sm:p-12 rounded-2xl border border-indigo-500/30 bg-linear-to-b from-indigo-950/30 via-slate-900/40 to-slate-900/40 text-center space-y-6 shadow-2xl">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              See MCPx recover a failed WebMCP transaction
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Run the included reference workflow and watch an uncertain action reconcile before the transaction safely rolls back.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/app"
              className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              Run the demo
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-5 py-3 rounded-lg font-medium text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            >
              View how it works
            </a>
          </div>
        </section>
      </main>

      {/* 11. Minimal Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">MCPx</span>
            <span>·</span>
            <span>Reliable transactions for WebMCP.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/app" className="hover:text-slate-200 transition-colors">
              Open app
            </Link>
            <a href="#how-it-works" className="hover:text-slate-200 transition-colors">
              How it works
            </a>
            <a href="#reliability" className="hover:text-slate-200 transition-colors">
              Reliability
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
