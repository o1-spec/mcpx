"use client";

import Link from "next/link";

interface HeroSectionProps {
  heroTraceStage: 0 | 1 | 2 | 3;
  setHeroTraceStage: (stage: 0 | 1 | 2 | 3) => void;
}

export default function HeroSection({ heroTraceStage, setHeroTraceStage }: HeroSectionProps) {
  return (
    <section
      id="hero-section"
      className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 md:px-8 max-w-330 mx-auto min-h-[calc(100vh-5rem)] flex flex-col justify-between relative z-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-2 sm:pt-6">
        {/* LEFT COLUMN (~48%): OVERSIZED EDITORIAL HERO */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="hero-eyebrow flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent-lime" />
            <span className="text-xs text-muted font-mono uppercase tracking-wider">
              [ WEBMCP RELIABILITY RUNTIME ]
            </span>
          </div>

          {/* Left-Aligned Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-[-0.055em] leading-[0.95]">
            <span className="block overflow-hidden">
              <span className="hero-headline-line block">WebMCP,</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-headline-line block">without the</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-headline-line block text-foreground">guesswork.</span>
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="hero-supporting text-base sm:text-lg text-muted max-w-140 leading-normal font-normal">
            MCPx runs consequential WebMCP workflows as durable transactions — recovering uncertain writes, reconciling authoritative state, and safely rolling back partial failures.
          </p>

          {/* Action Buttons */}
          <div className="hero-buttons flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/app"
              className="px-5 py-2.5 rounded bg-foreground text-background hover:bg-white font-semibold text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
            >
              <span>Open MCPx</span>
              <span>→</span>
            </Link>
            <Link
              href="/app"
              className="px-5 py-2.5 rounded text-foreground bg-white/4 hover:bg-white/8 border border-white/9 font-medium text-sm transition-colors cursor-pointer"
            >
              Run reference demo
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2.5 text-subtle hover:text-foreground font-mono text-xs transition-colors ml-1"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN (~52%): LIVE RELIABILITY RUNTIME PANEL */}
        <div className="lg:col-span-6">
          <div className="hero-runtime-panel border border-white/9 bg-panel p-5 sm:p-7 relative font-mono text-xs space-y-5">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-white/6 pb-3 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
                <span>LIVE TRANSACTION</span>
              </div>
              <span className="text-subtle">RUNTIME // ACTIVE</span>
            </div>

            {/* 4-Stage Transaction Trace */}
            <div className="space-y-3">
              {/* Stage 01: Execute */}
              <div
                onClick={() => setHeroTraceStage(0)}
                className={`p-3.5 border transition-all cursor-pointer ${
                  heroTraceStage === 0
                    ? "border-white/30 bg-[#0F1012] text-foreground"
                    : "border-white/4 bg-background text-subtle opacity-60 hover:opacity-90"
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-muted">01 · EXECUTE</span>
                  <span className={heroTraceStage === 0 ? "text-accent-lime" : "text-subtle"}>
                    create_route()
                  </span>
                </div>
                <div className="text-xs text-foreground">
                  Request dispatched across origin boundary
                </div>
              </div>

              {/* Stage 02: Outcome Unknown (IN_DOUBT) */}
              <div
                onClick={() => setHeroTraceStage(1)}
                className={`p-3.5 border transition-all cursor-pointer ${
                  heroTraceStage === 1
                    ? "border-amber-500/60 bg-amber-950/20 text-amber-300"
                    : "border-white/4 bg-background text-subtle opacity-60 hover:opacity-90"
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-muted">02 · OUTCOME UNKNOWN</span>
                  <span className="text-amber-400 font-semibold">IN_DOUBT</span>
                </div>
                <div className="text-xs text-amber-200">
                  Transport acknowledgement lost · Mutation not repeated
                </div>
              </div>

              {/* Stage 03: Authoritative Inspection */}
              <div
                onClick={() => setHeroTraceStage(2)}
                className={`p-3.5 border transition-all cursor-pointer ${
                  heroTraceStage === 2
                    ? "border-cyan-500/60 bg-cyan-950/20 text-cyan-300"
                    : "border-white/4 bg-background text-subtle opacity-60 hover:opacity-90"
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-muted">03 · AUTHORITATIVE INSPECTION</span>
                  <span className="text-cyan-400">get_route(operationKey)</span>
                </div>
                <div className="text-xs text-cyan-200">
                  Querying target state owner: exists: true
                </div>
              </div>

              {/* Stage 04: Recovery */}
              <div
                onClick={() => setHeroTraceStage(3)}
                className={`p-3.5 border transition-all cursor-pointer ${
                  heroTraceStage === 3
                    ? "border-accent-lime/60 bg-emerald-950/20 text-accent-lime"
                    : "border-white/4 bg-background text-subtle opacity-60 hover:opacity-90"
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-muted">04 · RECOVERY</span>
                  <span className="text-accent-lime font-semibold">✓ RECOVERED</span>
                </div>
                <div className="text-xs text-foreground">
                  Resource confirmed · Reconciled without duplicate mutation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HERO BOTTOM PROOF STRIP — 4-COLUMN GRID */}
      <div className="w-full pt-12 sm:pt-16 pb-2 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/8 border-t border-white/8 relative z-10 mt-8">
        <div className="hero-proof-cell px-4 py-3 sm:py-2">
          <div className="text-sm font-semibold text-foreground">
            WebMCP-native
          </div>
          <div className="text-xs text-muted font-mono mt-0.5">
            Cross-origin execution
          </div>
        </div>

        <div className="hero-proof-cell px-4 py-3 sm:py-2">
          <div className="text-sm font-semibold text-foreground">
            Durable state
          </div>
          <div className="text-xs text-muted font-mono mt-0.5">
            PostgreSQL-backed
          </div>
        </div>

        <div className="hero-proof-cell px-4 py-3 sm:py-2">
          <div className="text-sm font-semibold text-foreground">
            Authoritative
          </div>
          <div className="text-xs text-muted font-mono mt-0.5">
            Reconciliation
          </div>
        </div>

        <div className="hero-proof-cell px-4 py-3 sm:py-2">
          <div className="text-sm font-semibold text-foreground">
            Human-controlled
          </div>
          <div className="text-xs text-muted font-mono mt-0.5">
            Saga rollback
          </div>
        </div>
      </div>
    </section>
  );
}
