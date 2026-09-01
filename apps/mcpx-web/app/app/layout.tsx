"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import StatusPill from "@/components/ui/StatusPill";
import { useWebMCPBrowserRunner } from "@/hooks/useWebMCPBrowserRunner";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  // Active WebMCP Browser Runner Hook (claims work and executes native WebMCP tools)
  const { runnerId, isProcessing, lastExecutedNode } = useWebMCPBrowserRunner();

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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col md:flex-row selection:bg-accent-lime selection:text-background">
      {/* Background Engineering Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-30">
        <div className="w-full h-full max-w-360 mx-auto border-x border-white/4.5 grid grid-cols-4 md:grid-cols-8 divide-x divide-white/3.5" />
      </div>

      {/* ============================================================ */}
      {/* DESKTOP QUEUEWATCH-STYLE SIDEBAR (~240px) */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col justify-between w-60 shrink-0 border-r border-white/8 bg-panel p-4 min-h-screen sticky top-0 h-screen z-30">
        <div className="space-y-6">
          {/* Top Brand & Workspace Switcher */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-2 py-1 group cursor-pointer"
            >
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4 items-center justify-center">
                <span className="w-1.5 h-1.5 bg-accent-lime group-hover:scale-110 transition-transform"></span>
                <span className="w-1.5 h-1.5 bg-white/90"></span>
                <span className="w-1.5 h-1.5 bg-white/35"></span>
                <span className="w-1.5 h-1.5 bg-white/80"></span>
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground">
                MCPx
              </span>
              <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/8 text-subtle ml-auto">
                v0.1
              </span>
            </Link>

            {/* Workspace Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-background border border-white/8 hover:border-white/20 text-left text-xs font-mono transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-accent-lime"></span>
                  <span className="truncate text-foreground font-medium">Acme / Production</span>
                </div>
                <svg className="w-3.5 h-3.5 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {workspaceMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-panel border border-white/10 rounded p-1 space-y-0.5 text-xs font-mono z-40 shadow-xl">
                  <div className="px-2 py-1 text-subtle text-xs uppercase">
                    Workspaces
                  </div>
                  <div className="px-2 py-1.5 rounded bg-white/4 text-accent-lime flex items-center justify-between cursor-pointer">
                    <span>Acme / Production</span>
                    <span>✓</span>
                  </div>
                  <div
                    onClick={() => {
                      alert("Staging environment workspace switch.");
                      setWorkspaceMenuOpen(false);
                    }}
                    className="px-2 py-1.5 rounded hover:bg-white/3 text-muted hover:text-foreground flex items-center justify-between cursor-pointer"
                  >
                    <span>Acme / Staging</span>
                  </div>
                  <Link
                    href="/onboarding"
                    onClick={() => setWorkspaceMenuOpen(false)}
                    className="block px-2 py-1.5 rounded hover:bg-white/3 text-subtle hover:text-foreground border-t border-white/4 mt-1"
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
              <div className="px-2.5 pb-1.5 text-xs font-mono uppercase tracking-wider text-subtle">
                Control Plane
              </div>
              <nav className="space-y-0.5 font-mono text-xs">
                <Link
                  href="/app"
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${isOverview
                      ? "bg-white/7 text-foreground font-semibold border-l-2 border-accent-lime"
                      : "text-muted hover:text-foreground hover:bg-white/3"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Overview</span>
                  </div>
                  <span className="text-xs text-subtle">Runtime</span>
                </Link>

                <Link
                  href="/app/services"
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${isServices
                      ? "bg-white/7 text-foreground font-semibold border-l-2 border-accent-lime"
                      : "text-muted hover:text-foreground hover:bg-white/3"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Services</span>
                  </div>
                  <span className="text-xs text-subtle">4 ready</span>
                </Link>

                <Link
                  href="/app/workflows"
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${isWorkflows
                      ? "bg-white/7 text-foreground font-semibold border-l-2 border-accent-lime"
                      : "text-muted hover:text-foreground hover:bg-white/3"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Workflows</span>
                  </div>
                  <span className="text-xs text-subtle">Saga</span>
                </Link>

                <Link
                  href="/app/transactions"
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${isTransactions
                      ? "bg-white/7 text-foreground font-semibold border-l-2 border-accent-lime"
                      : "text-muted hover:text-foreground hover:bg-white/3"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span>Transactions</span>
                  </div>
                  <span className="text-xs text-subtle">Audit</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Utility & System Status */}
        <div className="space-y-3 pt-4 border-t border-white/8 text-xs font-mono text-subtle">
          <div className="p-2 bg-background border border-white/6 rounded space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-subtle">RUNTIME</span>
              <span className="text-accent-lime flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-subtle">PostgreSQL:</span>
              <span className="text-muted">Port 5435</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-subtle">WebMCP Runner:</span>
              <span className="text-accent-lime font-mono text-[10.5px]">
                {runnerId.slice(0, 10)}
              </span>
            </div>
            {isProcessing && (
              <div className="text-[10px] text-accent-cyan truncate animate-pulse">
                ▶ {lastExecutedNode || "Executing WebMCP..."}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1 text-xs">
            <Link
              href="/"
              className="text-muted hover:text-foreground transition-colors"
            >
              Documentation ↗
            </Link>
            <Link
              href="/signin"
              className="text-subtle hover:text-muted transition-colors"
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
        <header className="h-14 border-b border-white/8 bg-background/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded bg-white/4 border border-white/8 text-foreground cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-2 text-xs font-mono text-subtle">
              <Link href="/app" className="text-muted hover:text-foreground transition-colors">
                MCPx
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{breadcrumbTitle}</span>
            </div>
          </div>

          {/* Right utility actions */}
          <div className="flex items-center gap-3">
            {/* Quick search shortcut */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-panel border border-white/8 text-xs font-mono text-subtle">
              <svg className="w-3 h-3 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Quick jump…</span>
              <kbd className="px-1 bg-white/6 rounded text-[9.5px]">⌘K</kbd>
            </div>

            <StatusPill status="CONNECTED" showDot={true} size="sm" />

            <Link
              href="/app/workflows/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors cursor-pointer shadow-sm"
            >
              <span>+ New Workflow</span>
            </Link>
          </div>
        </header>

        {/* Mobile Flyout Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-panel border-b border-white/8 p-4 space-y-3 font-mono text-xs z-30">
            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-foreground hover:text-accent-lime"
            >
              Overview
            </Link>
            <Link
              href="/app/services"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-foreground hover:text-accent-lime"
            >
              Services
            </Link>
            <Link
              href="/app/workflows"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-foreground hover:text-accent-lime"
            >
              Workflows
            </Link>
            <Link
              href="/app/transactions"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-foreground hover:text-accent-lime"
            >
              Transactions
            </Link>
            <div className="pt-2 border-t border-white/6 flex items-center justify-between">
              <Link
                href="/app/workflows/new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 px-4 rounded bg-foreground text-background font-bold text-center text-xs"
              >
                + Create Workflow
              </Link>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-360 w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
