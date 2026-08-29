import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050607] text-[#F4F4F2] font-sans selection:bg-[#A6F275] selection:text-[#050607] relative overflow-x-hidden">
      {/* ============================================================ */}
      {/* 1. MINIMAL INFRASTRUCTURE NAVIGATION */}
      {/* ============================================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050607]/85 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            {/* Unboxed 4-tile geometric mark */}
            <div className="grid grid-cols-2 gap-1 w-5 h-5 items-center justify-center">
              <span className="w-2 h-2 rounded-[1px] bg-[#A6F275] group-hover:scale-105 transition-transform"></span>
              <span className="w-2 h-2 rounded-[1px] bg-[#F4F4F2]/90"></span>
              <span className="w-2 h-2 rounded-[1px] bg-[#F4F4F2]/35"></span>
              <span className="w-2 h-2 rounded-[1px] bg-[#F4F4F2]/80"></span>
            </div>
            <span className="font-display font-bold text-[18px] tracking-[-0.02em] text-[#F4F4F2]">
              MCPx
            </span>
          </Link>

          <nav className="flex items-center gap-7 sm:gap-8 text-[14px] sm:text-[15px] font-normal text-[#A0A3A8]">
            <a
              href="#product"
              className="hover:text-[#F4F4F2] transition-colors duration-150 hidden sm:inline"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#F4F4F2] transition-colors duration-150 hidden sm:inline"
            >
              How it works
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#F4F4F2] transition-colors duration-150 hidden sm:inline"
            >
              GitHub
            </a>
            <Link
              href="/app"
              className="px-4 py-2 rounded-lg bg-[#F4F4F2] text-[#050607] hover:bg-white font-medium text-[14px] sm:text-[15px] transition-all duration-150 cursor-pointer shadow-sm ml-1"
            >
              Open app
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION — ARCHITECTURAL PRODUCT SCULPTURE */}
      {/* ============================================================ */}
      <section className="relative pt-20 pb-16 px-6 sm:px-8 max-w-6xl mx-auto flex flex-col items-center justify-between min-h-[calc(100vh-5rem)]">
        {/* Large Atmospheric Background Architectural Sculpture */}
        <div className="w-full relative flex justify-center items-center overflow-visible select-none pt-2 sm:pt-4">
          {/* Volumetric ambient light ray from top-left */}
          <div className="absolute -top-16 left-1/2 -translate-x-[60%] w-[1000px] h-[550px] pointer-events-none opacity-20 mix-blend-screen overflow-hidden">
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
            <path
              d="M 120 180 L 220 120 L 220 280 L 120 340 Z"
              fill="url(#backgroundHex)"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
            <path
              d="M 230 110 L 340 50 L 340 230 L 230 290 Z"
              fill="url(#monolithSurface)"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
            <path
              d="M 720 180 L 620 120 L 620 280 L 720 340 Z"
              fill="url(#backgroundHex)"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
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

            {/* Central Elevated MCPx Transaction Core Monolith */}
            <g transform="translate(420, 115)">
              <circle cx="0" cy="0" r="70" fill="url(#coreGlow)" />

              <polygon
                points="0,-48 84,0 0,48 -84,0"
                fill="url(#monolithTopElevated)"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.2"
              />
              <polygon
                points="-84,0 0,48 0,110 -84,62"
                fill="url(#monolithSideElevated)"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
              />
              <polygon
                points="0,48 84,0 84,62 0,110"
                fill="#07080a"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />

              <polygon
                points="0,-32 56,0 0,32 -56,0"
                fill="#121418"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="0.8"
              />

              <rect
                x="-22"
                y="-15"
                width="16"
                height="10"
                rx="2"
                fill="#A6F275"
                transform="rotate(-15)"
              />
              <rect
                x="6"
                y="-15"
                width="16"
                height="10"
                rx="2"
                fill="#F4F4F2"
                transform="rotate(15)"
              />
              <rect
                x="-22"
                y="5"
                width="16"
                height="10"
                rx="2"
                fill="#3A3E48"
                transform="rotate(-15)"
              />
              <rect
                x="6"
                y="5"
                width="16"
                height="10"
                rx="2"
                fill="#E2E4DE"
                transform="rotate(15)"
              />

              <circle cx="0" cy="0" r="1.5" fill="#050607" />
            </g>
          </svg>
        </div>

        {/* Hero Copy & Call To Action */}
        <div className="text-center max-w-4xl mx-auto -mt-10 sm:-mt-16 lg:-mt-20 relative z-10 space-y-4">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275]"></span>
            <span className="text-[12px] sm:text-[13px] text-[#A0A3A8] font-normal tracking-normal">
              Reliability infrastructure for WebMCP
            </span>
          </div>

          {/* Main Headline (Manrope Display, ~56-58px desktop) */}
          <h1 className="font-display text-[32px] sm:text-[44px] md:text-[52px] lg:text-[58px] font-bold text-[#F4F4F2] tracking-[-0.035em] leading-[1.02] max-w-[760px] mx-auto">
            WebMCP, without the guesswork.
          </h1>

          {/* Supporting Text */}
          <p className="text-[14px] sm:text-[16px] lg:text-[17px] text-[#A0A3A8] max-w-[490px] mx-auto leading-[1.5] font-normal">
            MCPx makes multi-step browser actions durable, recoverable, and safe
            to roll back.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/app"
              className="w-full sm:w-auto px-4.5 py-2 rounded-xl text-[13px] sm:text-[14px] font-medium bg-[#F4F4F2] text-[#050607] hover:bg-white transition-all cursor-pointer shadow-sm"
            >
              Try the demo
            </Link>
            <a
              href="#product"
              className="w-full sm:w-auto px-4.5 py-2 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#F4F4F2] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
            >
              How it works
            </a>
          </div>
        </div>

        {/* Four Lightweight Proof Points */}
        <div className="w-full max-w-4xl pt-14 sm:pt-16 pb-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-left border-t border-white/[0.06] relative z-10">
          <div>
            <div className="text-[14px] sm:text-[15px] font-semibold text-[#F4F4F2]">
              WebMCP native
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#A0A3A8] mt-0.5">
              Cross-origin execution
            </div>
          </div>

          <div>
            <div className="text-[14px] sm:text-[15px] font-semibold text-[#F4F4F2]">
              Durable state
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#A0A3A8] mt-0.5">
              PostgreSQL backed
            </div>
          </div>

          <div>
            <div className="text-[14px] sm:text-[15px] font-semibold text-[#F4F4F2]">
              Authoritative
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#A0A3A8] mt-0.5">
              Reconciliation
            </div>
          </div>

          <div>
            <div className="text-[14px] sm:text-[15px] font-semibold text-[#F4F4F2]">
              Human controlled
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#A0A3A8] mt-0.5">
              Saga rollback
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SECTION 1: "What are you orchestrating?" (Product Paths) */}
      {/* ============================================================ */}
      <section id="product" className="py-20 sm:py-28 px-6 sm:px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="space-y-10">
          {/* Left-Aligned Section Header */}
          <div className="max-w-2xl space-y-2.5">
            <span className="text-[12px] font-mono text-[#A6F275] tracking-wide uppercase">
              Orchestration Lifecycle
            </span>
            <h2 className="font-display text-[28px] sm:text-[38px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.1]">
              What are you orchestrating?
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] leading-relaxed">
              Connect WebMCP applications, define how consequential actions recover, and compose them into durable multi-step workflows.
            </p>
          </div>

          {/* Three Substantial Horizontal Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Connect Services */}
            <div className="p-6 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono text-[#73777D]">01 · Discovery</span>
                <h3 className="font-display text-[18px] sm:text-[20px] font-semibold text-[#F4F4F2]">
                  Connect services
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#A0A3A8] leading-relaxed">
                  Bring WebMCP-enabled applications into MCPx and discover the tools they expose to your browser.
                </p>
              </div>

              {/* Technical Preview */}
              <div className="p-3.5 rounded-xl bg-[#050607] border border-white/[0.04] font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between text-[#73777D] text-[10px] pb-1 border-b border-white/[0.04]">
                  <span className="text-[#F4F4F2]">billing.example.com</span>
                  <span className="text-[#A6F275]">6 tools found</span>
                </div>
                <div className="space-y-1 text-[#A0A3A8]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275]"></span>
                    <span>create_invoice</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                    <span>get_invoice</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                    <span>delete_invoice</span>
                  </div>
                </div>
              </div>

              <Link
                href="/app/services/new"
                className="inline-flex items-center text-[13px] font-medium text-[#A6F275] hover:underline gap-1 pt-0.5"
              >
                Explore services →
              </Link>
            </div>

            {/* Card 2: Define Reliability */}
            <div className="p-6 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono text-[#73777D]">02 · Contracts</span>
                <h3 className="font-display text-[18px] sm:text-[20px] font-semibold text-[#F4F4F2]">
                  Define reliability
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#A0A3A8] leading-relaxed">
                  Tell MCPx how a consequential operation should be executed, inspected, and compensated.
                </p>
              </div>

              {/* Technical Preview */}
              <div className="p-3.5 rounded-xl bg-[#050607] border border-white/[0.04] font-mono text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#73777D]">Execute</span>
                  <span className="text-[#F4F4F2]">create_invoice</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#73777D]">Inspect</span>
                  <span className="text-[#A6F275]">get_invoice</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#73777D]">Compensate</span>
                  <span className="text-[#F4F4F2]">delete_invoice</span>
                </div>
                <div className="pt-1 border-t border-white/[0.04] flex items-center justify-between text-[9.5px] text-[#73777D]">
                  <span>Identity key</span>
                  <span className="text-[#A0A3A8]">operationKey</span>
                </div>
              </div>

              <Link
                href="/app/services"
                className="inline-flex items-center text-[13px] font-medium text-[#A6F275] hover:underline gap-1 pt-0.5"
              >
                Reliability contracts →
              </Link>
            </div>

            {/* Card 3: Compose Workflows */}
            <div className="p-6 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono text-[#73777D]">03 · Execution</span>
                <h3 className="font-display text-[18px] sm:text-[20px] font-semibold text-[#F4F4F2]">
                  Compose workflows
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#A0A3A8] leading-relaxed">
                  Combine reliable operations into dependency-aware transactions without hardcoding the workflow into MCPx.
                </p>
              </div>

              {/* Technical Preview */}
              <div className="p-3.5 rounded-xl bg-[#050607] border border-white/[0.04] font-mono text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#F4F4F2]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275]"></span>
                  <span>Create customer</span>
                </div>
                <div className="pl-2 text-[#73777D] text-[9.5px]">↓</div>
                <div className="flex items-center gap-1.5 text-[#F4F4F2]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275]"></span>
                  <span>Create workspace</span>
                </div>
                <div className="pl-2 text-[#73777D] text-[9.5px]">↓</div>
                <div className="flex items-center gap-1.5 text-[#A0A3A8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                  <span>Send invite</span>
                </div>
              </div>

              <Link
                href="/app/workflows/new"
                className="inline-flex items-center text-[13px] font-medium text-[#A6F275] hover:underline gap-1 pt-0.5"
              >
                Build workflows →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SECTION 2: FAILURE STORY ("The request failed. Did the write?") */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-20 sm:py-28 px-6 sm:px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Story Heading & Explanation */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[12px] font-mono text-[#A6F275] tracking-wide uppercase">
              Uncertain outcomes
            </span>
            <h2 className="font-display text-[28px] sm:text-[38px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.1]">
              The request failed. Did the write?
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] leading-relaxed">
              A lost response does not tell MCPx whether a consequential action actually committed. Instead of retrying blindly, MCPx asks the application that owns the state.
            </p>
            <div className="pt-1">
              <Link
                href="/app"
                className="inline-flex items-center text-[13px] font-medium text-[#A6F275] hover:underline gap-1"
              >
                See reconciliation in action →
              </Link>
            </div>
          </div>

          {/* Right Column: 3 Connected State Stages */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Stage 1: Request Dispatched */}
            <div className="p-4.5 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10.5px] font-mono text-[#73777D] uppercase">Stage 01 · Dispatch</span>
                <div className="font-mono text-[13px] text-[#F4F4F2]">create_route()</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-white/[0.05] text-[#A0A3A8]">
                Dispatched
              </span>
            </div>

            {/* Connecting Datum Line */}
            <div className="flex justify-center">
              <div className="h-5 w-px bg-white/[0.1] -my-1"></div>
            </div>

            {/* Stage 2: Response Lost / IN_DOUBT */}
            <div className="p-4.5 rounded-2xl bg-[#0C0D0E] border border-amber-500/30 flex items-center justify-between shadow-[0_0_25px_rgba(245,158,11,0.06)]">
              <div className="space-y-0.5">
                <span className="text-[10.5px] font-mono text-amber-400 uppercase">Stage 02 · Transport Ack Lost</span>
                <div className="font-mono text-[13px] text-[#F4F4F2]">Outcome uncertain (network exception)</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-amber-950/60 border border-amber-500/40 text-amber-300 font-semibold">
                IN_DOUBT
              </span>
            </div>

            {/* Connecting Datum Line */}
            <div className="flex justify-center">
              <div className="h-5 w-px bg-white/[0.1] -my-1"></div>
            </div>

            {/* Stage 3: Authoritative Inspection & Recovery */}
            <div className="p-4.5 rounded-2xl bg-[#0C0D0E] border border-[#A6F275]/30 flex items-center justify-between shadow-[0_0_25px_rgba(166,242,117,0.06)]">
              <div className="space-y-0.5">
                <span className="text-[10.5px] font-mono text-[#A6F275] uppercase">Stage 03 · Authoritative Ground Truth</span>
                <div className="font-mono text-[13px] text-[#F4F4F2]">get_route(opKey) → exists: true</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-emerald-950/60 border border-[#A6F275]/40 text-[#A6F275] font-semibold">
                RECOVERED
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: THREE RELIABILITY OUTCOMES BLOCKS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-14 border-t border-white/[0.05] mt-14">
          <div className="p-5 rounded-2xl bg-[#0C0D0E]/60 border border-white/[0.04] space-y-2">
            <h3 className="font-display text-[15px] sm:text-[16px] font-semibold text-[#F4F4F2]">
              Recover uncertainty
            </h3>
            <p className="text-[13px] text-[#A0A3A8] leading-relaxed">
              Inspect authoritative remote state instead of assuming a timed-out write failed.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0D0E]/60 border border-white/[0.04] space-y-2">
            <h3 className="font-display text-[15px] sm:text-[16px] font-semibold text-[#F4F4F2]">
              Roll back partial work
            </h3>
            <p className="text-[13px] text-[#A0A3A8] leading-relaxed">
              Calculate compensation in reverse dependency order and verify every resource is gone.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0D0E]/60 border border-white/[0.04] space-y-2">
            <h3 className="font-display text-[15px] sm:text-[16px] font-semibold text-[#F4F4F2]">
              Keep humans in control
            </h3>
            <p className="text-[13px] text-[#A0A3A8] leading-relaxed">
              Pause before destructive compensation and show operators exactly what MCPx plans to remove.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. SECTION 4: REFERENCE WORKFLOW (REAL DAG TOPOLOGY) */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 px-6 sm:px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="space-y-10">
          {/* Header */}
          <div className="max-w-2xl space-y-2.5">
            <span className="text-[12px] font-mono text-[#A6F275] tracking-wide uppercase">
              Reference implementation
            </span>
            <h2 className="font-display text-[28px] sm:text-[38px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.1]">
              See the runtime under pressure.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] leading-relaxed">
              The included deployment workflow uses four independent WebMCP applications to demonstrate cross-origin execution, uncertainty recovery, durable state, and reverse Saga compensation.
            </p>
          </div>

          {/* Architectural DAG Layout Container */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] space-y-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-5 border-b border-white/[0.04]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono text-[#73777D]">Live Scenario Execution</span>
                <div className="text-[14px] font-medium text-[#F4F4F2]">
                  4-Service Microservices Stack Topology
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/app"
                  className="px-3.5 py-1.5 rounded-lg bg-[#F4F4F2] text-[#050607] hover:bg-white font-medium text-[12px] transition-colors"
                >
                  Run reference workflow
                </Link>
                <a
                  href="#how-it-works"
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] text-[#F4F4F2] hover:bg-white/[0.08] border border-white/[0.08] text-[12px] transition-colors"
                >
                  View architecture
                </a>
              </div>
            </div>

            {/* Visual DAG Flow */}
            <div className="space-y-5 max-w-2xl mx-auto py-2">
              {/* Layer 1: Database */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm p-3.5 rounded-xl bg-[#050607] border border-white/[0.08] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[13px] font-semibold text-[#F4F4F2]">Database</div>
                    <div className="text-[11px] text-[#73777D] font-mono">create_database()</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-[#A6F275] border border-[#A6F275]/30">
                    ✓ COMMITTED
                  </span>
                </div>
              </div>

              {/* Connector */}
              <div className="flex justify-center">
                <div className="h-5 w-px bg-white/[0.1]"></div>
              </div>

              {/* Layer 2: Backend */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm p-3.5 rounded-xl bg-[#050607] border border-white/[0.08] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[13px] font-semibold text-[#F4F4F2]">Backend Compute</div>
                    <div className="text-[11px] text-[#73777D] font-mono">deploy_backend()</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-[#A6F275] border border-[#A6F275]/30">
                    ✓ BOUND
                  </span>
                </div>
              </div>

              {/* Split Connector */}
              <div className="flex justify-center items-center gap-32 sm:gap-40">
                <span className="h-5 w-px bg-white/[0.1] -rotate-25 transform origin-top"></span>
                <span className="h-5 w-px bg-white/[0.1] rotate-25 transform origin-top"></span>
              </div>

              {/* Layer 3: Routing & Frontend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Routing Box */}
                <div className="p-3.5 rounded-xl bg-[#050607] border border-amber-500/30 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-semibold text-[#F4F4F2]">Routing Gateway</div>
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-amber-950/60 text-amber-300 border border-amber-500/40 font-medium">
                      IN_DOUBT
                    </span>
                  </div>
                  <div className="text-[10.5px] font-mono text-[#A0A3A8]">
                    IN_DOUBT → RECONCILING → <span className="text-[#A6F275]">RECOVERED</span>
                  </div>
                </div>

                {/* Frontend Box */}
                <div className="p-3.5 rounded-xl bg-[#050607] border border-rose-500/30 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-semibold text-[#F4F4F2]">Frontend Host</div>
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-rose-950/60 text-rose-300 border border-rose-500/40 font-medium">
                      FAILED
                    </span>
                  </div>
                  <div className="text-[10.5px] font-mono text-[#A0A3A8]">
                    Rejected before commit (simulated failure)
                  </div>
                </div>
              </div>

              {/* Compensation Cascade Summary */}
              <div className="p-3.5 rounded-xl bg-[#08090B] border border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-[#A0A3A8]">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">⚡ Human Approval Gate:</span>
                  <span>Routing → Backend → Database</span>
                </div>
                <span className="text-[#A6F275] font-semibold">ALL COMPENSATED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. SECTION 5: LARGE LIGHT CONTRAST SECTION ("Why MCPx") */}
      {/* ============================================================ */}
      <section className="bg-[#F2F2EE] text-[#111210] py-20 sm:py-28 px-6 sm:px-8 border-y border-black/[0.06] selection:bg-[#111210] selection:text-[#F2F2EE]">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="max-w-2xl space-y-2.5">
            <span className="text-[12px] font-mono text-[#4D7C0F] tracking-wide uppercase">
              Why MCPx
            </span>
            <h2 className="font-display text-[28px] sm:text-[38px] font-bold text-[#111210] tracking-[-0.03em] leading-[1.1]">
              Reliability is a runtime concern.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#4B5563] leading-relaxed">
              Consequential browser workflows need more than successful API calls. MCPx keeps operation identity, authoritative state, transaction history, and human control in one runtime.
            </p>
          </div>

          {/* Loose Editorial 6-Panel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Panel 1: Authoritative Reconciliation */}
            <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#6B7280]">01 · Ground Truth</span>
                <h3 className="font-display text-[17px] sm:text-[18px] font-semibold text-[#111210]">
                  Authoritative reconciliation
                </h3>
                <p className="text-[14px] font-medium text-[#1F2937]">
                  &ldquo;Unknown is not failure.&rdquo;
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-black/[0.04] font-mono text-[10.5px] space-y-1 text-[#4B5563]">
                <div>EXECUTING</div>
                <div className="text-[#9CA3AF]">↓</div>
                <div className="text-[#D97706] font-semibold">IN_DOUBT</div>
                <div className="text-[#9CA3AF]">↓</div>
                <div>INSPECT(opKey)</div>
                <div className="text-[#9CA3AF]">↓</div>
                <div className="text-[#15803D] font-semibold">RECOVERED</div>
              </div>
            </div>

            {/* Panel 2: Durable Execution */}
            <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#6B7280]">02 · Persistence</span>
                <h3 className="font-display text-[17px] sm:text-[18px] font-semibold text-[#111210]">
                  Durable execution
                </h3>
                <p className="text-[13px] text-[#4B5563] leading-relaxed">
                  Every state transition and node outcome is durably logged to PostgreSQL before downstream progression.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-black/[0.04] font-mono text-[10.5px] space-y-1.5 text-[#4B5563]">
                <div className="flex justify-between border-b border-black/[0.04] pb-1">
                  <span>Transaction</span>
                  <span className="font-semibold text-[#111210]">#18</span>
                </div>
                <div className="flex justify-between text-[9.5px] text-[#6B7280]">
                  <span>Events logged</span>
                  <span>01 · 02 · 03 · 04</span>
                </div>
                <div className="text-[9.5px] text-[#15803D] font-semibold pt-0.5">
                  ✓ PostgreSQL Persisted
                </div>
              </div>
            </div>

            {/* Panel 3: No Blind Retry */}
            <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#6B7280]">03 · Idempotency</span>
                <h3 className="font-display text-[17px] sm:text-[18px] font-semibold text-[#111210]">
                  No blind retry
                </h3>
                <p className="text-[13px] text-[#4B5563] leading-relaxed">
                  Deterministic operation keys guarantee mutations are never re-issued blindly over lost transport channels.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-black/[0.04] font-mono text-[10.5px] space-y-1 text-[#4B5563]">
                <div>Execute once</div>
                <div className="text-[#9CA3AF]">↓ response lost</div>
                <div>Inspect remote store</div>
                <div className="text-[#9CA3AF]">↓ resource found</div>
                <div className="text-[#15803D] font-semibold">No duplicate mutation</div>
              </div>
            </div>

            {/* Panel 4: Human-Controlled Rollback */}
            <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#6B7280]">04 · Safety</span>
                <h3 className="font-display text-[17px] sm:text-[18px] font-semibold text-[#111210]">
                  Human-controlled rollback
                </h3>
                <p className="text-[13px] text-[#4B5563] leading-relaxed">
                  Destructive Saga compensations require human verification before executing deletions across origins.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-black/[0.04] font-mono text-[10.5px] space-y-1 text-[#4B5563]">
                <div className="text-[9.5px] text-[#6B7280]">3 resources exist:</div>
                <div className="text-[#111210] font-medium">Routing · Backend · Database</div>
                <div className="text-[#D97706] font-semibold text-[9.5px] pt-0.5">
                  ⏸ Operator approval required
                </div>
              </div>
            </div>

            {/* Panel 5: Crash Recovery */}
            <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#6B7280]">05 · Resilience</span>
                <h3 className="font-display text-[17px] sm:text-[18px] font-semibold text-[#111210]">
                  Crash recovery
                </h3>
                <p className="text-[13px] text-[#4B5563] leading-relaxed">
                  Browser refresh or process termination resumes smoothly from durable state without lost context.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-black/[0.04] font-mono text-[10.5px] space-y-1 text-[#4B5563]">
                <div>Browser refreshed</div>
                <div className="text-[#9CA3AF]">↓</div>
                <div>Transaction restored</div>
                <div className="text-[#9CA3AF]">↓</div>
                <div className="text-[#15803D] font-semibold">Reconciliation resumed</div>
              </div>
            </div>

            {/* Panel 6: Bring Your Own WebMCP Service */}
            <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#6B7280]">06 · Extensibility</span>
                <h3 className="font-display text-[17px] sm:text-[18px] font-semibold text-[#111210]">
                  Bring your own service
                </h3>
                <p className="text-[13px] text-[#4B5563] leading-relaxed">
                  Onboard any WebMCP-compliant microservice in seconds without altering MCPx coordinator code.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-black/[0.04] font-mono text-[10.5px] space-y-1 text-[#4B5563]">
                <div className="text-[#111210] font-semibold">billing.example.com</div>
                <div className="text-[#6B7280]">6 tools · 2 contracts</div>
                <div className="text-[#15803D] font-semibold pt-0.5">
                  ✓ Ready for workflows
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. SECTION 6: PRODUCT GENERALITY ("Your services. Your workflows.") */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 px-6 sm:px-8 max-w-6xl mx-auto border-b border-white/[0.06]">
        <div className="space-y-10">
          {/* Header */}
          <div className="max-w-2xl space-y-2.5">
            <span className="text-[12px] font-mono text-[#A6F275] tracking-wide uppercase">
              Generic Product Platform
            </span>
            <h2 className="font-display text-[28px] sm:text-[38px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.1]">
              Your services. Your workflows.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] leading-relaxed">
              The included deployment is only a reference workflow. MCPx can connect to other compatible WebMCP applications, discover their tools, configure reliability contracts, and run workflows built from those contracts.
            </p>
          </div>

          {/* 5-Stage Progression Flow */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-center text-[11px] font-mono">
              <div className="p-3 rounded-lg bg-[#050607] border border-white/[0.04] space-y-1">
                <span className="text-[#A6F275]">01</span>
                <div className="text-[#F4F4F2]">Connect service</div>
              </div>
              <div className="p-3 rounded-lg bg-[#050607] border border-white/[0.04] space-y-1">
                <span className="text-[#A6F275]">02</span>
                <div className="text-[#F4F4F2]">Discover tools</div>
              </div>
              <div className="p-3 rounded-lg bg-[#050607] border border-white/[0.04] space-y-1">
                <span className="text-[#A6F275]">03</span>
                <div className="text-[#F4F4F2]">Define contract</div>
              </div>
              <div className="p-3 rounded-lg bg-[#050607] border border-white/[0.04] space-y-1">
                <span className="text-[#A6F275]">04</span>
                <div className="text-[#F4F4F2]">Create workflow</div>
              </div>
              <div className="p-3 rounded-lg bg-[#050607] border border-white/[0.04] space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[#A6F275]">05</span>
                <div className="text-[#A6F275] font-semibold">Run reliably</div>
              </div>
            </div>

            {/* Realistic External Example */}
            <div className="p-4 rounded-xl bg-[#050607] border border-white/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-[11.5px] text-[#A0A3A8]">
              <div className="space-y-0.5">
                <div className="text-[#F4F4F2] font-semibold">Widget Factory Service</div>
                <div className="text-[10.5px] text-[#73777D]">
                  create_widget · get_widget · delete_widget
                </div>
              </div>
              <div className="text-[10.5px] text-[#A6F275]">
                Contract configured → Ready for custom DAG composition
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. SECTION 7: FINAL CALL TO ACTION */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 px-6 sm:px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="font-display text-[30px] sm:text-[42px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.08]">
          Build workflows that know what happened.
        </h2>
        <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] max-w-[500px] mx-auto leading-relaxed">
          Connect WebMCP services and run consequential actions with durable execution, authoritative reconciliation, and controlled rollback.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <Link
            href="/app"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-medium bg-[#F4F4F2] text-[#050607] hover:bg-white transition-all cursor-pointer shadow-sm"
          >
            Open MCPx
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#F4F4F2] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. MINIMAL FOOTER */}
      {/* ============================================================ */}
      <footer className="border-t border-white/[0.06] py-10 px-6 sm:px-8 max-w-6xl mx-auto text-[11px] text-[#73777D]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-[#A6F275]"></span>
              <span className="text-[#F4F4F2] font-semibold text-[14px]">MCPx</span>
            </div>
            <p className="text-[12px] text-[#A0A3A8]">
              Reliable transactions for WebMCP.
            </p>
          </div>

          <nav className="flex items-center gap-5 text-[12px] text-[#A0A3A8]">
            <a href="#product" className="hover:text-[#F4F4F2] transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-[#F4F4F2] transition-colors">
              How it works
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#F4F4F2] transition-colors">
              GitHub
            </a>
            <Link href="/app" className="hover:text-[#F4F4F2] transition-colors">
              Open app
            </Link>
          </nav>
        </div>

        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>Apache-2.0 License</span>
          <span>WebMCP Reliability Runtime</span>
        </div>
      </footer>
    </div>
  );
}
