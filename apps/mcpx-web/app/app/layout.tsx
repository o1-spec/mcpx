"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import StatusPill from "@/components/ui/StatusPill";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const isOverview = pathname === "/app";
  const isServices = pathname?.startsWith("/app/services");
  const isWorkflows = pathname?.startsWith("/app/workflows");
  const isTransactions = pathname?.startsWith("/app/transactions");

  // Determine current breadcrumb
  let breadcrumbTitle = "Overview";
  if (isServices) breadcrumbTitle = "Services";
  if (pathname === "/app/services/new") breadcrumbTitle = "Services / Connect Service";
  if (isWorkflows) breadcrumbTitle = "Workflows";
  if (pathname === "/app/workflows/new") breadcrumbTitle = "Workflows / Workflow Builder";
  if (isTransactions) breadcrumbTitle = "Transactions";

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F5F3] font-sans flex flex-col md:flex-row selection:bg-[#A5F36B] selection:text-[#070708]">
      {/* Background Engineering Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-30">
        <div className="w-full h-full max-w-[1440px] mx-auto border-x border-white/[0.045] grid grid-cols-4 md:grid-cols-8 divide-x divide-white/[0.035]" />
      </div>

      {/* ============================================================ */}
      {/* DESKTOP QUEUEWATCH-STYLE SIDEBAR (~240px) */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col justify-between w-[240px] shrink-0 border-r border-white/[0.08] bg-[#0B0C0E] p-4 min-h-screen sticky top-0 h-screen z-30">
        <div className="space-y-6">
          {/* Top Brand & Workspace Switcher */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-2 py-1 group cursor-pointer"
            >
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4 items-center justify-center">
                <span className="w-1.5 h-1.5 bg-[#A5F36B] group-hover:scale-110 transition-transform"></span>
                <span className="w-1.5 h-1.5 bg-white/90"></span>
                <span className="w-1.5 h-1.5 bg-white/35"></span>
                <span className="w-1.5 h-1.5 bg-white/80"></span>
              </div>
              <span className="font-bold text-[15px] tracking-tight text-[#F5F5F3]">
                MCPx
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-[#66686D] ml-auto">
                v0.1
              </span>
            </Link>

            {/* Workspace Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-[#070708] border border-white/[0.08] hover:border-white/20 text-left text-[12px] font-mono transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#A5F36B]"></span>
                  <span className="truncate text-[#F5F5F3] font-medium">Acme / Production</span>
                </div>
                <svg className="w-3.5 h-3.5 text-[#66686D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {workspaceMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0B0C0E] border border-white/[0.1] rounded p-1 space-y-0.5 text-[11.5px] font-mono z-40 shadow-xl">
                  <div className="px-2 py-1 text-[#66686D] text-[10px] uppercase">
                    Workspaces
                  </div>
                  <div className="px-2 py-1.5 rounded bg-white/[0.04] text-[#A5F36B] flex items-center justify-between cursor-pointer">
                    <span>Acme / Production</span>
                    <span>✓</span>
                  </div>
                  <div
                    onClick={() => {
                      alert("Staging environment workspace switch.");
                      setWorkspaceMenuOpen(false);
                    }}
                    className="px-2 py-1.5 rounded hover:bg-white/[0.03] text-[#A0A0A4] hover:text-[#F5F5F3] flex items-center justify-between cursor-pointer"
                  >
                    <span>Acme / Staging</span>
                  </div>
                  <Link
                    href="/onboarding"
                    onClick={() => setWorkspaceMenuOpen(false)}
                    className="block px-2 py-1.5 rounded hover:bg-white/[0.03] text-[#66686D] hover:text-[#F5F5F3] border-t border-white/[0.04] mt-1"
                  >
                    + New workspace
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Grouped Navigation */}
          <div className="space-y-4">
            <div>
              <div className="px-2.5 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#66686D]">
                Control Plane
              </div>
              <nav className="space-y-0.5 font-mono text-[12px]">
                <Link
                  href="/app"
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                    isOverview
                      ? "bg-white/[0.07] text-[#F5F5F3] font-semibold border-l-2 border-[#A5F36B]"
                      : "text-[#A0A0A4] hover:text-[#F5F5F3] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Overview</span>
                  </div>
                  <span className="text-[10px] text-[#66686D]">Runtime</span>
                </Link>

                <Link
                  href="/app/services"
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                    isServices
                      ? "bg-white/[0.07] text-[#F5F5F3] font-semibold border-l-2 border-[#A5F36B]"
                      : "text-[#A0A0A4] hover:text-[#F5F5F3] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Services</span>
                  </div>
                  <span className="text-[10px] text-[#66686D]">4 ready</span>
                </Link>

                <Link
                  href="/app/workflows"
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                    isWorkflows
                      ? "bg-white/[0.07] text-[#F5F5F3] font-semibold border-l-2 border-[#A5F36B]"
                      : "text-[#A0A0A4] hover:text-[#F5F5F3] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Workflows</span>
                  </div>
                  <span className="text-[10px] text-[#66686D]">Saga</span>
                </Link>

                <Link
                  href="/app/transactions"
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                    isTransactions
                      ? "bg-white/[0.07] text-[#F5F5F3] font-semibold border-l-2 border-[#A5F36B]"
                      : "text-[#A0A0A4] hover:text-[#F5F5F3] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span>Transactions</span>
                  </div>
                  <span className="text-[10px] text-[#66686D]">Audit</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Utility & System Status */}
        <div className="space-y-3 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-[#66686D]">
          <div className="p-2 bg-[#070708] border border-white/[0.06] rounded space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#66686D]">RUNTIME</span>
              <span className="text-[#A5F36B] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A5F36B] animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#66686D]">PostgreSQL:</span>
              <span className="text-[#A0A0A4]">Port 5435</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11.5px]">
            <Link
              href="/"
              className="text-[#A0A0A4] hover:text-[#F5F5F3] transition-colors"
            >
              Documentation ↗
            </Link>
            <Link
              href="/signin"
              className="text-[#66686D] hover:text-[#A0A0A4] transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT SURFACE WITH TOP BAR */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header Bar */}
        <header className="h-[56px] border-b border-white/[0.08] bg-[#070708]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#F5F5F3] cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-2 text-[12px] font-mono text-[#66686D]">
              <Link href="/app" className="text-[#A0A0A4] hover:text-[#F5F5F3] transition-colors">
                MCPx
              </Link>
              <span>/</span>
              <span className="text-[#F5F5F3] font-medium">{breadcrumbTitle}</span>
            </div>
          </div>

          {/* Right utility actions */}
          <div className="flex items-center gap-3">
            {/* Quick search shortcut */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#0B0C0E] border border-white/[0.08] text-[11.5px] font-mono text-[#66686D]">
              <svg className="w-3 h-3 text-[#66686D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Quick jump…</span>
              <kbd className="px-1 bg-white/[0.06] rounded text-[9.5px]">⌘K</kbd>
            </div>

            <StatusPill status="CONNECTED" showDot={true} size="sm" />

            <Link
              href="/app/workflows/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[12px] font-sans transition-colors cursor-pointer shadow-sm"
            >
              <span>+ New Workflow</span>
            </Link>
          </div>
        </header>

        {/* Mobile Flyout Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B0C0E] border-b border-white/[0.08] p-4 space-y-3 font-mono text-[13px] z-30">
            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#F5F5F3] hover:text-[#A5F36B]"
            >
              Overview
            </Link>
            <Link
              href="/app/services"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#F5F5F3] hover:text-[#A5F36B]"
            >
              Services
            </Link>
            <Link
              href="/app/workflows"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#F5F5F3] hover:text-[#A5F36B]"
            >
              Workflows
            </Link>
            <Link
              href="/app/transactions"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#F5F5F3] hover:text-[#A5F36B]"
            >
              Transactions
            </Link>
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <Link
                href="/app/workflows/new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 px-4 rounded bg-[#F5F5F3] text-[#070708] font-bold text-center text-[12px]"
              >
                + Create Workflow
              </Link>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
