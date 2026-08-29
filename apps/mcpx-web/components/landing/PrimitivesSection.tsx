"use client";

export default function PrimitivesSection() {
  return (
    <section
      id="capabilities"
      className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
    >
      <div className="space-y-10">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
            [ RELIABILITY PRIMITIVES ]
          </span>
          <h2 className="text-3xl sm:text-5xl md:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
            Reliability primitives, not retry wrappers.
          </h2>
          <p className="text-base sm:text-base text-muted leading-relaxed">
            Every consequential WebMCP operation implements deterministic execution, inspection, and reverse compensation contracts.
          </p>
        </div>

        {/* 4 Capability Grid Cells */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/9 divide-y sm:divide-y-0 sm:divide-x divide-white/9 bg-panel font-mono text-xs">
          {/* Cell 01: Execute */}
          <div className="capability-cell p-6 sm:p-7 space-y-4">
            <div className="h-17.5 border-b border-white/6 flex items-center justify-between text-xs text-subtle">
              <span>[ 01 ]</span>
              <span className="text-foreground">EXECUTE</span>
            </div>
            <h3 className="text-base font-bold text-foreground">Operation Identity</h3>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Bind consequential actions to a stable operation identity across origins.
            </p>
          </div>

          {/* Cell 02: Inspect */}
          <div className="capability-cell p-6 sm:p-7 space-y-4">
            <div className="h-17.5 border-b border-white/6 flex items-center justify-between text-xs text-subtle">
              <span>[ 02 ]</span>
              <span className="text-cyan-400">INSPECT</span>
            </div>
            <h3 className="text-base font-bold text-foreground">Authoritative Inspection</h3>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Ask the application that owns the resource what actually exists.
            </p>
          </div>

          {/* Cell 03: Reconcile */}
          <div className="capability-cell p-6 sm:p-7 space-y-4">
            <div className="h-17.5 border-b border-white/6 flex items-center justify-between text-xs text-subtle">
              <span>[ 03 ]</span>
              <span className="text-accent-lime">RECONCILE</span>
            </div>
            <h3 className="text-base font-bold text-foreground">Uncertainty Recovery</h3>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Resolve uncertain outcomes through authoritative inspection instead of blindly repeating the mutation.
            </p>
          </div>

          {/* Cell 04: Compensate */}
          <div className="capability-cell p-6 sm:p-7 space-y-4">
            <div className="h-17.5 border-b border-white/6 flex items-center justify-between text-xs text-subtle">
              <span>[ 04 ]</span>
              <span className="text-amber-400">COMPENSATE</span>
            </div>
            <h3 className="text-base font-bold text-foreground">Verified Compensation</h3>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Undo completed work in reverse dependency order and inspect again to verify absence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
