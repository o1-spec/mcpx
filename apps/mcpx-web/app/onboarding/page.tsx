"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F5F3] font-sans selection:bg-[#A5F36B] selection:text-[#070708] flex flex-col justify-between relative overflow-hidden">
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-35">
        <div className="w-full h-full max-w-[1320px] mx-auto border-x border-white/[0.045] grid grid-cols-4 md:grid-cols-8 divide-x divide-white/[0.035]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between max-w-[1320px] mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="grid grid-cols-2 gap-0.5 w-4 h-4 items-center justify-center">
            <span className="w-1.5 h-1.5 bg-[#A5F36B]"></span>
            <span className="w-1.5 h-1.5 bg-white/90"></span>
            <span className="w-1.5 h-1.5 bg-white/35"></span>
            <span className="w-1.5 h-1.5 bg-white/80"></span>
          </div>
          <span className="font-bold text-[16px] tracking-tight text-[#F5F5F3]">
            MCPx Setup
          </span>
        </div>

        <Link
          href="/app"
          className="text-[12px] font-mono text-[#A0A0A4] hover:text-[#F5F5F3] transition-colors"
        >
          Skip to Dashboard →
        </Link>
      </header>

      {/* Main Steps Wizard */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl border border-white/[0.09] bg-[#0B0C0E] p-8 space-y-8 shadow-2xl rounded-sm">
          {/* Progress Strip */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 font-mono text-[11px]">
            <div className="flex items-center gap-6">
              <span className={step === 1 ? "text-[#A5F36B] font-bold" : "text-[#66686D]"}>
                [ 01 ] ENVIRONMENT
              </span>
              <span className={step === 2 ? "text-[#A5F36B] font-bold" : "text-[#66686D]"}>
                [ 02 ] SERVICES
              </span>
              <span className={step === 3 ? "text-[#A5F36B] font-bold" : "text-[#66686D]"}>
                [ 03 ] VERIFY RUN
              </span>
            </div>
            <span className="text-[#66686D]">STEP {step} OF 3</span>
          </div>

          {/* Step 1: Environment Provisioning */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-[20px] font-bold text-[#F5F5F3] font-sans">
                  PostgreSQL Durability & Coordinator Configured
                </h2>
                <p className="text-[13px] text-[#A0A0A4] leading-relaxed">
                  MCPx is running on PostgreSQL with state persistence, cross-origin message verification, and Saga compensations enabled.
                </p>
              </div>

              <div className="p-4 bg-[#070708] border border-white/[0.06] font-mono text-[11.5px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#66686D]">State Coordinator:</span>
                  <span className="text-[#A5F36B]">✓ ACTIVE (http://localhost:3000)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#66686D]">PostgreSQL Persistence:</span>
                  <span className="text-[#A5F36B]">✓ CONNECTED (port 5435)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#66686D]">WebMCP Bridge:</span>
                  <span className="text-cyan-300">✓ document.modelContext READY</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-2.5 px-4 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[13px] font-sans transition-colors cursor-pointer"
              >
                Next: Connect WebMCP Services →
              </button>
            </div>
          )}

          {/* Step 2: Reference Services */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-[20px] font-bold text-[#F5F5F3] font-sans">
                  4 Reference Microservices Connected
                </h2>
                <p className="text-[13px] text-[#A0A0A4] leading-relaxed">
                  Your workspace includes 4 reference microservices exposing WebMCP tools across different origins for testing durable transactions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11.5px]">
                <div className="p-3 bg-[#070708] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[#F5F5F3] font-sans font-bold">Routing Service</div>
                    <div className="text-[10.5px] text-[#66686D]">port 3001 · 3 tools</div>
                  </div>
                  <span className="text-[#A5F36B] text-[10px]">READY</span>
                </div>
                <div className="p-3 bg-[#070708] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[#F5F5F3] font-sans font-bold">Database Service</div>
                    <div className="text-[10.5px] text-[#66686D]">port 3002 · 3 tools</div>
                  </div>
                  <span className="text-[#A5F36B] text-[10px]">READY</span>
                </div>
                <div className="p-3 bg-[#070708] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[#F5F5F3] font-sans font-bold">Compute Service</div>
                    <div className="text-[10.5px] text-[#66686D]">port 3003 · 3 tools</div>
                  </div>
                  <span className="text-[#A5F36B] text-[10px]">READY</span>
                </div>
                <div className="p-3 bg-[#070708] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[#F5F5F3] font-sans font-bold">Frontend Service</div>
                    <div className="text-[10.5px] text-[#66686D]">port 3004 · 3 tools</div>
                  </div>
                  <span className="text-[#A5F36B] text-[10px]">READY</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded bg-transparent hover:bg-white/[0.04] border border-white/[0.09] text-[#A0A0A4] font-mono text-[12px] cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 px-4 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[13px] font-sans transition-colors cursor-pointer"
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
                <h2 className="text-[20px] font-bold text-[#F5F5F3] font-sans">
                  Ready to Launch Control Plane
                </h2>
                <p className="text-[13px] text-[#A0A0A4] leading-relaxed">
                  Your environment is completely initialized. You can now execute workflows, inspect authoritative state, test network partitions, and inspect live transaction logs.
                </p>
              </div>

              <div className="p-4 bg-[#070708] border border-emerald-500/20 text-emerald-300 font-mono text-[12px] flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#A5F36B] animate-pulse"></span>
                <span>System health: 100% · All 4 services discovered</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded bg-transparent hover:bg-white/[0.04] border border-white/[0.09] text-[#A0A0A4] font-mono text-[12px] cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => router.push("/app")}
                  className="flex-1 py-2.5 px-4 rounded bg-[#A5F36B] text-[#070708] hover:bg-[#b5f883] font-bold text-[13px] font-sans transition-colors cursor-pointer shadow-sm"
                >
                  Open MCPx Control Plane →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 p-6 text-center text-[11px] font-mono text-[#66686D]">
        <span>MCPx WORKSPACE ONBOARDING</span>
      </footer>
    </div>
  );
}
