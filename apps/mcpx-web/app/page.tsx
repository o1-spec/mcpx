import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050607] text-[#F4F4F2] font-sans selection:bg-[#A6F275] selection:text-[#050607] relative overflow-x-hidden">
      {/* ============================================================ */}
      {/* 1. MINIMAL NAVIGATION */}
      {/* ============================================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050607]/80 backdrop-blur-md border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            {/* Minimal geometric MCPx mark */}
            <div className="grid grid-cols-2 gap-0.5 p-1 rounded bg-[#111215] border border-white/[0.08]">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-[#A6F275]"></span>
              <span className="w-1.5 h-1.5 rounded-[1px] bg-white/70"></span>
              <span className="w-1.5 h-1.5 rounded-[1px] bg-white/40"></span>
              <span className="w-1.5 h-1.5 rounded-[1px] bg-white/70"></span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#F4F4F2] font-sans">
              MCPx
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-xs text-[#919498]">
            <a
              href="#how-it-works"
              className="hover:text-[#F4F4F2] transition-colors hidden sm:inline"
            >
              How it works
            </a>
            <a
              href="#reliability"
              className="hover:text-[#F4F4F2] transition-colors hidden sm:inline"
            >
              Reliability
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#F4F4F2] transition-colors hidden sm:inline"
            >
              GitHub
            </a>
            <Link
              href="/app"
              className="px-3 py-1.5 rounded-lg bg-[#F4F4F2] text-[#050607] hover:bg-white font-medium transition-colors text-xs cursor-pointer shadow-sm"
            >
              Open app
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION — ARCHITECTURAL PRODUCT SCULPTURE */}
      {/* ============================================================ */}
      <section className="relative pt-14 pb-16 px-6 max-w-6xl mx-auto flex flex-col items-center justify-between min-h-[calc(100vh-3.5rem)]">
        {/* Large Atmospheric Background Architectural Sculpture */}
        <div className="w-full relative flex justify-center items-center overflow-visible select-none pt-4 sm:pt-6">
          {/* Volumetric ambient light ray from top-left */}
          <div className="absolute -top-16 left-1/2 translate-x-[-60%] w-[1000px] h-[550px] pointer-events-none opacity-20 mix-blend-screen overflow-hidden">
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_35%_20%,rgba(255,255,255,0.4)_0%,rgba(166,242,117,0.1)_25%,rgba(5,6,7,0)_70%)]" />
          </div>

          <svg
            className="w-full max-w-[840px] h-[340px] sm:h-[400px] pointer-events-none relative z-0"
            viewBox="0 0 840 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Monolithic dark facets */}
              <linearGradient id="monolithTopElevated" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1c1f26" />
                <stop offset="60%" stopColor="#101217" />
                <stop offset="100%" stopColor="#0a0c0f" />
              </linearGradient>
              <linearGradient id="monolithSideElevated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12141a" />
                <stop offset="100%" stopColor="#050608" />
              </linearGradient>

              <linearGradient id="monolithSurface" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111317" />
                <stop offset="100%" stopColor="#060709" />
              </linearGradient>

              <linearGradient id="backgroundHex" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0d0f13" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#050607" stopOpacity="0" />
              </linearGradient>

              {/* Telemetry vertical fade */}
              <linearGradient id="telemetryBeam" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#A6F275" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#A6F275" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#A6F275" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="telemetryDim" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#F4F4F2" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#F4F4F2" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#F4F4F2" stopOpacity="0" />
              </linearGradient>

              {/* Core glow */}
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#A6F275" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#050607" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Architectural Monoliths (Peripheral Surfaces) */}
            {/* Far Left Monolith */}
            <path
              d="M 120 180 L 220 120 L 220 280 L 120 340 Z"
              fill="url(#backgroundHex)"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
            {/* Mid Left Monolith */}
            <path
              d="M 230 110 L 340 50 L 340 230 L 230 290 Z"
              fill="url(#monolithSurface)"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
            {/* Far Right Monolith */}
            <path
              d="M 720 180 L 620 120 L 620 280 L 720 340 Z"
              fill="url(#backgroundHex)"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
            {/* Mid Right Monolith */}
            <path
              d="M 610 110 L 500 50 L 500 230 L 610 290 Z"
              fill="url(#monolithSurface)"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />

            {/* Lower Supporting Shelf Monoliths */}
            <path
              d="M 290 250 L 420 180 L 550 250 L 420 320 Z"
              fill="#080a0d"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />

            {/* Vertical Telemetry Beams Stream from Core Upward */}
            <line
              x1="408"
              y1="100"
              x2="408"
              y2="0"
              stroke="url(#telemetryDim)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <line
              x1="414"
              y1="92"
              x2="414"
              y2="0"
              stroke="url(#telemetryBeam)"
              strokeWidth="1.2"
              strokeDasharray="4 2"
            />
            <line
              x1="420"
              y1="90"
              x2="420"
              y2="0"
              stroke="url(#telemetryBeam)"
              strokeWidth="1.5"
            />
            <line
              x1="426"
              y1="92"
              x2="426"
              y2="0"
              stroke="url(#telemetryBeam)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <line
              x1="432"
              y1="100"
              x2="432"
              y2="0"
              stroke="url(#telemetryDim)"
              strokeWidth="1"
              strokeDasharray="1 4"
            />

            {/* ======================================================== */}
            {/* CENTRAL ELEVATED MCPX TRANSACTION CORE MONOLITH */}
            {/* ======================================================== */}
            <g transform="translate(420, 115)">
              {/* Soft radial aura under the central chip */}
              <circle cx="0" cy="0" r="70" fill="url(#coreGlow)" />

              {/* Main Core Isometric Cuboid Base */}
              {/* Top Facet */}
              <polygon
                points="0,-48 84,0 0,48 -84,0"
                fill="url(#monolithTopElevated)"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.2"
              />
              {/* Left Side */}
              <polygon
                points="-84,0 0,48 0,110 -84,62"
                fill="url(#monolithSideElevated)"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
              />
              {/* Right Side */}
              <polygon
                points="0,48 84,0 84,62 0,110"
                fill="#07080a"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />

              {/* Inner Raised Control Plate */}
              <polygon
                points="0,-32 56,0 0,32 -56,0"
                fill="#121418"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="0.8"
              />

              {/* Central Geometric Hardware Unit Mark */}
              {/* Top-Left Accent Tile (Restrained Lime) */}
              <rect
                x="-22"
                y="-15"
                width="16"
                height="10"
                rx="2"
                fill="#A6F275"
                transform="rotate(-15)"
              />
              {/* Top-Right White Tile */}
              <rect
                x="6"
                y="-15"
                width="16"
                height="10"
                rx="2"
                fill="#F4F4F2"
                transform="rotate(15)"
              />
              {/* Bottom-Left Slate Tile */}
              <rect
                x="-22"
                y="5"
                width="16"
                height="10"
                rx="2"
                fill="#3A3E48"
                transform="rotate(-15)"
              />
              {/* Bottom-Right White Tile */}
              <rect
                x="6"
                y="5"
                width="16"
                height="10"
                rx="2"
                fill="#E2E4DE"
                transform="rotate(15)"
              />

              {/* Center Datum Point */}
              <circle cx="0" cy="0" r="1.5" fill="#050607" />
            </g>
          </svg>
        </div>

        {/* Hero Copy & Call To Action */}
        <div className="text-center max-w-2xl mx-auto -mt-8 sm:-mt-12 relative z-10 space-y-5">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275]"></span>
            <span className="text-xs text-[#919498] font-medium tracking-wide">
              Reliability infrastructure for WebMCP
            </span>
          </div>

          {/* Main Headline (Inter Tight Display, 64px range, -0.045em tracking, 0.98 line height) */}
          <h1 className="font-display text-[44px] sm:text-[60px] lg:text-[66px] font-semibold text-[#F4F4F2] tracking-[-0.045em] leading-[0.98]">
            WebMCP, without the guesswork.
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-[#919498] max-w-[520px] mx-auto leading-relaxed font-normal">
            MCPx makes multi-step browser actions durable, recoverable, and safe
            to roll back.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/app"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-medium bg-[#F4F4F2] text-[#050607] hover:bg-white transition-all cursor-pointer shadow-sm"
            >
              Try the demo
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-medium text-[#F4F4F2] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
            >
              How it works
            </a>
          </div>
        </div>

        {/* Four Lightweight Proof Points (Clean columns, zero cards, generous negative space) */}
        <div className="w-full max-w-4xl pt-14 sm:pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-left border-t border-white/[0.05] relative z-10">
          <div>
            <div className="text-xs font-medium text-[#DCDDD9]">
              WebMCP native
            </div>
            <div className="text-[11px] text-[#6A6D72] mt-0.5">
              Cross-origin execution
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#DCDDD9]">
              Durable state
            </div>
            <div className="text-[11px] text-[#6A6D72] mt-0.5">
              PostgreSQL backed
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#DCDDD9]">
              Authoritative
            </div>
            <div className="text-[11px] text-[#6A6D72] mt-0.5">
              Reconciliation
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#DCDDD9]">
              Human controlled
            </div>
            <div className="text-[11px] text-[#6A6D72] mt-0.5">
              Saga rollback
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SECTION 2: TECHNICAL EXPLANATION & ARCHITECTURE */}
      {/* ============================================================ */}
      <section
        id="how-it-works"
        className="max-w-4xl mx-auto px-6 py-24 border-t border-white/[0.05] space-y-16"
      >
        <div className="max-w-2xl space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#A6F275]">
            Reconciliation & Safety
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#F4F4F2]">
            A timeout is not a failure.
          </h2>
          <p className="text-xs sm:text-sm text-[#919498] leading-relaxed">
            A WebMCP action can commit successfully while its transport
            acknowledgement never reaches the caller. Blindly retrying causes
            duplicated state; blindly failing causes unmanaged orphan resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0B0D] space-y-2">
            <span className="font-semibold text-[#DCDDD9] block">
              01 · Uncertainty
            </span>
            <p className="text-[#919498] text-[11px] leading-relaxed">
              When a network exception or timeout occurs after dispatch, the step
              transitions to <code className="text-amber-400 font-mono">IN_DOUBT</code> instead
              of assuming failure.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0B0D] space-y-2">
            <span className="font-semibold text-[#DCDDD9] block">
              02 · Authoritative query
            </span>
            <p className="text-[#919498] text-[11px] leading-relaxed">
              MCPx queries the service&apos;s registered inspection contract using
              a deterministic idempotency key to discover remote ground truth.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0B0D] space-y-2">
            <span className="font-semibold text-[#DCDDD9] block">
              03 · Safe recovery
            </span>
            <p className="text-[#919498] text-[11px] leading-relaxed">
              If the write occurred, state transitions to{" "}
              <code className="text-[#A6F275] font-mono">RECOVERED</code> without
              redundant execution. If downstream steps fail, human-approved
              compensation rolls back in reverse.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SECTION 3: RELIABILITY CONTRACT */}
      {/* ============================================================ */}
      <section
        id="reliability"
        className="max-w-4xl mx-auto px-6 py-16 border-t border-white/[0.05] space-y-6"
      >
        <div className="max-w-2xl space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#A6F275]">
            Specification
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#F4F4F2]">
            The Execute / Inspect / Compensate contract
          </h2>
          <p className="text-xs sm:text-sm text-[#919498] leading-relaxed">
            Every consequential WebMCP service connects without runtime code
            changes by declaring three tool mappings.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0A0B0D] font-mono text-xs text-[#DCDDD9] space-y-3">
          <div className="text-[#6A6D72]">// MCPx Reliability Contract</div>
          <div className="text-[#919498]">
            <span className="text-[#A6F275]">Execute:</span> dispatch consequential
            write with deterministic{" "}
            <code className="text-[#F4F4F2]">operationKey</code>
          </div>
          <div className="text-[#919498]">
            <span className="text-[#A6F275]">Inspect:</span> query authoritative ground
            truth via <code className="text-[#F4F4F2]">operationKey</code>
          </div>
          <div className="text-[#919498]">
            <span className="text-[#A6F275]">Compensate:</span> reverse / soft-delete
            mutation idempotently if downstream steps fail
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. MINIMAL FOOTER */}
      {/* ============================================================ */}
      <footer className="border-t border-white/[0.05] py-8 text-center text-xs text-[#6A6D72]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A6F275]"></span>
            <span className="text-[#DCDDD9] font-medium">MCPx</span>
            <span className="text-[#6A6D72]">
              · Reliability infrastructure for WebMCP
            </span>
          </div>
          <div className="text-[#6A6D72] text-[11px]">Apache-2.0 License</div>
        </div>
      </footer>
    </div>
  );
}
