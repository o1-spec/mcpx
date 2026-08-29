"use client";

export default function UncertaintySection() {
  return (
    <section
      id="problem"
      className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
    >
      <div className="space-y-10">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
            [ DISTRIBUTED UNCERTAINTY ]
          </span>
          <h2 className="text-3xl sm:text-5xl md:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
            A timeout doesn’t tell you what happened.
          </h2>
          <p className="text-base sm:text-base text-muted leading-relaxed">
            A consequential write can commit successfully while its response disappears in transit. Retrying may duplicate the mutation. Assuming failure may corrupt state.
          </p>
        </div>

        {/* 3 Large Grid Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-white/9 divide-y md:divide-y-0 md:divide-x divide-white/9 bg-panel font-mono text-xs">
          {/* Column 01 */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="text-xs text-subtle">[ 01 ]</div>
            <div className="text-base font-bold text-foreground">WRITE SENT</div>
            <div className="p-3 border border-white/6 bg-background text-muted">
              create_route(spec) →
            </div>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Mutation dispatched across origins to the state-owning service.
            </p>
          </div>

          {/* Column 02 */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="text-xs text-subtle">[ 02 ]</div>
            <div className="text-base font-bold text-amber-300">ACK LOST</div>
            <div className="p-3 border border-amber-500/30 bg-amber-950/20 text-amber-300 font-semibold">
              ? IN_DOUBT
            </div>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Response packet dropped. Runtime halts blind retry to prevent duplicate creation.
            </p>
          </div>

          {/* Column 03 */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="text-xs text-subtle">[ 03 ]</div>
            <div className="text-base font-bold text-accent-lime">GROUND TRUTH</div>
            <div className="p-3 border border-accent-lime/30 bg-emerald-950/20 text-accent-lime font-semibold">
              get_route(opKey) → RECOVERED
            </div>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Authoritative query discovers resource exists. Reconciled safely.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
