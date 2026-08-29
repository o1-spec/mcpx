"use client";

export default function ComparisonSection() {
  return (
    <section
      id="reliability"
      className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Large Copy */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
            [ COMPARISON // RUNTIME ]
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-[-0.04em] leading-[1.08]">
            Naive retry logic treats a timeout like failure.
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-[-0.03em] leading-[1.1]">
            MCPx treats <span className="text-accent-lime">uncertainty</span> as a state.
          </h3>
          <p className="text-sm sm:text-base text-muted leading-relaxed pt-1">
            Instead of guessing whether a consequential write succeeded, MCPx reconciles against authoritative service state before progressing or compensating.
          </p>
        </div>

        {/* Right Split Comparison */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 border border-white/9 divide-y sm:divide-y-0 sm:divide-x divide-white/9 bg-panel font-mono text-xs">
          {/* Left: Traditional Retry Logic */}
          <div className="p-6 space-y-4">
            <div className="text-xs text-subtle border-b border-white/6 pb-2">
              TRADITIONAL RETRY LOGIC
            </div>
            <div className="space-y-2 text-muted">
              <div>Request timeout</div>
              <div className="text-center text-subtle">↓</div>
              <div className="text-rose-400 font-semibold">FAILED (Assumed)</div>
              <div className="text-center text-subtle">↓</div>
              <div>Blind retry mutation</div>
            </div>
            <div className="pt-4 border-t border-white/6 text-rose-300 font-sans text-xs">
              Risk: Duplicate writes & orphaned resources.
            </div>
          </div>

          {/* Right: MCPx Runtime */}
          <div className="p-6 space-y-4 bg-[#0F1012]">
            <div className="text-xs text-accent-lime border-b border-white/6 pb-2">
              MCPX RELIABILITY RUNTIME
            </div>
            <div className="space-y-2">
              <div className="text-foreground">Request timeout</div>
              <div className="text-center text-subtle">↓</div>
              <div className="text-amber-400 font-semibold">IN_DOUBT (Uncertain)</div>
              <div className="text-center text-subtle">↓</div>
              <div className="text-cyan-300">Inspect authoritative state</div>
              <div className="text-center text-subtle">↓</div>
              <div className="text-accent-lime font-semibold">✓ RECOVERED</div>
            </div>
            <div className="pt-4 border-t border-white/6 text-accent-lime font-sans text-xs">
              Result: Resource confirmed without reissuing mutation.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
