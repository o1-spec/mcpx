"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent-lime selection:text-background flex flex-col justify-between relative overflow-hidden">
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-35">
        <div className="w-full h-full max-w-330 mx-auto border-x border-white/4.5 grid grid-cols-4 md:grid-cols-8 divide-x divide-white/3.5" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between max-w-330 mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="grid grid-cols-2 gap-0.5 w-4 h-4 items-center justify-center">
            <span className="w-1.5 h-1.5 bg-accent-lime"></span>
            <span className="w-1.5 h-1.5 bg-white/90"></span>
            <span className="w-1.5 h-1.5 bg-white/35"></span>
            <span className="w-1.5 h-1.5 bg-white/80"></span>
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            MCPx Setup
          </span>
        </div>

        <Link
          href="/app"
          className="text-xs font-mono text-muted hover:text-foreground transition-colors"
        >
          Skip to Dashboard →
        </Link>
      </header>

      {/* Main Steps Wizard */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl border border-white/9 bg-panel p-8 space-y-8 shadow-2xl rounded-sm">
          {/* Progress Strip */}
          <div className="flex items-center justify-between border-b border-white/6 pb-4 font-mono text-xs">
            <div className="flex items-center gap-6">
              <span className={step === 1 ? "text-accent-lime font-bold" : "text-subtle"}>
                [ 01 ] ENVIRONMENT
              </span>
              <span className={step === 2 ? "text-accent-lime font-bold" : "text-subtle"}>
                [ 02 ] SERVICES
              </span>
              <span className={step === 3 ? "text-accent-lime font-bold" : "text-subtle"}>
                [ 03 ] VERIFY RUN
              </span>
            </div>
            <span className="text-subtle">STEP {step} OF 3</span>
          </div>

          {/* Step 1: Environment Provisioning */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground font-sans">
                  PostgreSQL Durability & Coordinator Configured
                </h2>
                <p className="text-xs text-muted leading-relaxed">
                  MCPx is running on PostgreSQL with state persistence, cross-origin message verification, and Saga compensations enabled.
                </p>
              </div>

              <div className="p-4 bg-background border border-white/6 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-subtle">State Coordinator:</span>
                  <span className="text-accent-lime">✓ ACTIVE (http://localhost:3000)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-subtle">PostgreSQL Persistence:</span>
                  <span className="text-accent-lime">✓ CONNECTED (port 5435)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-subtle">WebMCP Bridge:</span>
                  <span className="text-cyan-300">✓ document.modelContext READY</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-2.5 px-4 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors cursor-pointer"
              >
                Next: Connect WebMCP Services →
              </button>
            </div>
          )}

          {/* Step 2: Reference Services */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground font-sans">
                  4 Reference Microservices Connected
                </h2>
                <p className="text-xs text-muted leading-relaxed">
                  Your workspace includes 4 reference microservices exposing WebMCP tools across different origins for testing durable transactions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-background border border-white/6 flex items-center justify-between">
                  <div>
                    <div className="text-foreground font-sans font-bold">Routing Service</div>
                    <div className="text-xs text-subtle">port 3001 · 3 tools</div>
                  </div>
                  <span className="text-accent-lime text-xs">READY</span>
                </div>
                <div className="p-3 bg-background border border-white/6 flex items-center justify-between">
                  <div>
                    <div className="text-foreground font-sans font-bold">Database Service</div>
                    <div className="text-xs text-subtle">port 3002 · 3 tools</div>
                  </div>
                  <span className="text-accent-lime text-xs">READY</span>
                </div>
                <div className="p-3 bg-background border border-white/6 flex items-center justify-between">
                  <div>
                    <div className="text-foreground font-sans font-bold">Compute Service</div>
                    <div className="text-xs text-subtle">port 3003 · 3 tools</div>
                  </div>
                  <span className="text-accent-lime text-xs">READY</span>
                </div>
                <div className="p-3 bg-background border border-white/6 flex items-center justify-between">
                  <div>
                    <div className="text-foreground font-sans font-bold">Frontend Service</div>
                    <div className="text-xs text-subtle">port 3004 · 3 tools</div>
                  </div>
                  <span className="text-accent-lime text-xs">READY</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded bg-transparent hover:bg-white/4 border border-white/9 text-muted font-mono text-xs cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 px-4 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors cursor-pointer"
                >
                  Next: Verify Workflow Run →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Run Reference Workflow */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground font-sans">
                  Ready to Launch Control Plane
                </h2>
                <p className="text-xs text-muted leading-relaxed">
                  Your environment is completely initialized. You can now execute workflows, inspect authoritative state, test network partitions, and inspect live transaction logs.
                </p>
              </div>

              <div className="p-4 bg-background border border-emerald-500/20 text-emerald-300 font-mono text-xs flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse"></span>
                <span>System health: 100% · All 4 services discovered</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded bg-transparent hover:bg-white/4 border border-white/9 text-muted font-mono text-xs cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => router.push("/app")}
                  className="flex-1 py-2.5 px-4 rounded bg-accent-lime text-background hover:bg-accent-lime/90 font-bold text-xs font-sans transition-colors cursor-pointer shadow-sm"
                >
                  Open MCPx Control Plane →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 p-6 text-center text-xs font-mono text-subtle">
        <span>MCPx WORKSPACE ONBOARDING</span>
      </footer>
    </div>
  );
}
