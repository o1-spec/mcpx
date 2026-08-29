"use client";

export default function GroundTruthSection() {
  return (
    <section
      id="ground-truth"
      className="bg-[#F2F2EE] text-[#111210] py-20 sm:py-28 px-4 sm:px-6 md:px-8 border-y border-black/8 selection:bg-[#111210] selection:text-[#F2F2EE] transition-colors duration-200 relative z-10"
    >
      <div className="max-w-330 mx-auto space-y-12">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono text-[#4D7C0F] uppercase tracking-wider">
            [ GROUND TRUTH THESIS ]
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#111210] tracking-[-0.04em] leading-[1.05]">
            Built around ground truth.
          </h2>
          <p className="text-base text-[#4B5563] leading-relaxed">
            Consequential systems cannot rely on optimistic transport. The application that owns the resource is the sole authority on state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/8 border border-black/8 bg-[#F2F2EE]">
          <div className="p-8 space-y-3">
            <h3 className="text-xl font-bold text-[#111210]">Unknown is not failure.</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              When transport acknowledgements drop, operations enter authoritative inspection rather than being written off as errors.
            </p>
          </div>

          <div className="p-8 space-y-3">
            <h3 className="text-xl font-bold text-[#111210]">Durability before UI state.</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              Every node transition, attempt, and inspection event is durably committed to PostgreSQL before downstream progression.
            </p>
          </div>

          <div className="p-8 space-y-3 border-t border-black/8">
            <h3 className="text-xl font-bold text-[#111210]">Compensation is verified.</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              Saga rollbacks execute in strict reverse dependency order and inspect remote state to confirm deletion occurred.
            </p>
          </div>

          <div className="p-8 space-y-3 border-t border-black/8">
            <h3 className="text-xl font-bold text-[#111210]">The application owns the truth.</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              MCPx never assumes external state; it queries the WebMCP application directly via its inspection contracts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
