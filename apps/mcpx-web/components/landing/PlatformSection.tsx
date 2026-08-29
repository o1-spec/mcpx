"use client";

export default function PlatformSection() {
  return (
    <section
      id="product"
      className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
    >
      <div className="space-y-10">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
            [ DEVELOPER PLATFORM ]
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
            Bring your own WebMCP service.
          </h2>
          <p className="text-base text-muted leading-relaxed">
            Connect compatible applications, discover their tools, define reliability contracts, and compose them into multi-step workflows without modifying the MCPx runtime.
          </p>
        </div>

        {/* Connected Grid Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border border-white/9 divide-y sm:divide-y-0 sm:divide-x divide-white/9 bg-panel font-mono text-xs">
          <div className="p-5 space-y-2">
            <div className="text-xs text-subtle">[ 01 ]</div>
            <div className="font-bold text-foreground">CONNECT</div>
            <div className="text-xs text-muted">billing.example.com</div>
          </div>

          <div className="p-5 space-y-2">
            <div className="text-xs text-subtle">[ 02 ]</div>
            <div className="font-bold text-foreground">DISCOVER</div>
            <div className="text-xs text-accent-lime">6 tools found</div>
          </div>

          <div className="p-5 space-y-2">
            <div className="text-xs text-subtle">[ 03 ]</div>
            <div className="font-bold text-foreground">CONTRACT</div>
            <div className="text-xs text-muted">Execute / Inspect</div>
          </div>

          <div className="p-5 space-y-2">
            <div className="text-xs text-subtle">[ 04 ]</div>
            <div className="font-bold text-foreground">COMPOSE</div>
            <div className="text-xs text-muted">DAG Pipeline</div>
          </div>

          <div className="p-5 space-y-2 bg-[#0F1012]">
            <div className="text-xs text-accent-lime">[ 05 ]</div>
            <div className="font-bold text-accent-lime">RUN</div>
            <div className="text-xs text-foreground">Durable transaction</div>
          </div>
        </div>
      </div>
    </section>
  );
}
