"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isOverview = pathname === "/app";
  const isServices = pathname?.startsWith("/app/services");
  const isWorkflows = pathname?.startsWith("/app/workflows");
  const isTransactions = pathname?.startsWith("/app/transactions");

  // Determine breadcrumb
  let breadcrumb = "Overview";
  if (isServices) breadcrumb = "Services";
  if (pathname === "/app/services/new") breadcrumb = "Services / Connect Service";
  if (isWorkflows) breadcrumb = "Workflows";
  if (pathname === "/app/workflows/new") breadcrumb = "Workflows / Workflow Builder";
  if (isTransactions) breadcrumb = "Transactions";

  return (
    <div className="min-h-screen bg-[#080A0B] text-[#F2F3F1] font-sans flex flex-col md:flex-row selection:bg-[#A5F36B] selection:text-[#080A0B]">
      {/* ============================================================ */}
      {/* DESKTOP SLIM LEFT SIDEBAR (~220px) */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col justify-between w-[220px] shrink-0 border-r border-white/[0.06] bg-[#0C0E0F] p-4 min-h-screen sticky top-0 h-screen z-30">
        <div className="space-y-6">
          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5 px-2 py-1 group cursor-pointer">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4 items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#A5F36B] group-hover:scale-105 transition-transform"></span>
              <span className="w-1.5 h-1.5 bg-[#F2F3F1] opacity-90"></span>
              <span className="w-1.5 h-1.5 bg-[#F2F3F1] opacity-35"></span>
              <span className="w-1.5 h-1.5 bg-[#F2F3F1] opacity-80"></span>
            </div>
            <span className="font-display font-bold text-[16px] tracking-[-0.02em] text-[#F2F3F1]">
              MCPx
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1 font-mono text-[12.5px]">
            <Link
              href="/app"
              className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                isOverview
                  ? "bg-[#101316] text-[#F2F3F1] font-semibold border-l-2 border-[#A5F36B]"
                  : "text-[#969B9E] hover:text-[#F2F3F1] hover:bg-white/[0.03]"
              }`}
            >
              <span>Overview</span>
            </Link>

            <Link
              href="/app/services"
              className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                isServices
                  ? "bg-[#101316] text-[#F2F3F1] font-semibold border-l-2 border-[#A5F36B]"
                  : "text-[#969B9E] hover:text-[#F2F3F1] hover:bg-white/[0.03]"
              }`}
            >
              <span>Services</span>
            </Link>

            <Link
              href="/app/workflows"
              className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                isWorkflows
                  ? "bg-[#101316] text-[#F2F3F1] font-semibold border-l-2 border-[#A5F36B]"
                  : "text-[#969B9E] hover:text-[#F2F3F1] hover:bg-white/[0.03]"
              }`}
            >
              <span>Workflows</span>
            </Link>

            <Link
              href="/app/transactions"
              className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                isTransactions
                  ? "bg-[#101316] text-[#F2F3F1] font-semibold border-l-2 border-[#A5F36B]"
                  : "text-[#969B9E] hover:text-[#F2F3F1] hover:bg-white/[0.03]"
              }`}
            >
              <span>Transactions</span>
            </Link>
          </nav>
        </div>

        {/* Secondary Bottom Area */}
        <div className="space-y-4 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-[#65696B]">
          <div className="space-y-1.5 px-2">
            <div className="text-[10px] uppercase tracking-wider text-[#969B9E]">Runtime</div>
            <div className="flex items-center gap-1.5 text-[#F2F3F1]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A5F36B]"></span>
              <span>4 reference services</span>
            </div>
            <div className="text-[#65696B]">PostgreSQL connected</div>
          </div>

          <div className="space-y-1 px-2 pt-2 border-t border-white/[0.04]">
            <div className="text-[10px] uppercase tracking-wider text-[#969B9E]">Reference workflow</div>
            <div className="text-[#F2F3F1]">Application deployment</div>
          </div>

          <div className="pt-2 px-2">
            <Link
              href="/"
              className="text-[#969B9E] hover:text-[#F2F3F1] flex items-center gap-1 transition-colors"
            >
              <span>Homepage</span>
              <span>↗</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MOBILE TOP BAR + DRAWER */}
      {/* ============================================================ */}
      <div className="md:hidden border-b border-white/[0.06] bg-[#0C0E0F] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
            <span className="w-1 h-1 bg-[#A5F36B]"></span>
            <span className="w-1 h-1 bg-[#F2F3F1]"></span>
            <span className="w-1 h-1 bg-[#F2F3F1] opacity-40"></span>
            <span className="w-1 h-1 bg-[#F2F3F1] opacity-80"></span>
          </div>
          <span className="font-bold text-[15px] text-[#F2F3F1]">MCPx</span>
          <span className="text-xs text-[#65696B] font-mono">/ {breadcrumb}</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded border border-white/[0.1] bg-white/[0.04] text-[#F2F3F1] min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0C0E0F] border-b border-white/[0.08] p-4 space-y-3 z-40 font-mono text-[13px]">
          <Link
            href="/app"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 px-3 rounded ${isOverview ? "bg-[#101316] text-[#F2F3F1] font-semibold" : "text-[#969B9E]"}`}
          >
            Overview
          </Link>
          <Link
            href="/app/services"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 px-3 rounded ${isServices ? "bg-[#101316] text-[#F2F3F1] font-semibold" : "text-[#969B9E]"}`}
          >
            Services
          </Link>
          <Link
            href="/app/workflows"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 px-3 rounded ${isWorkflows ? "bg-[#101316] text-[#F2F3F1] font-semibold" : "text-[#969B9E]"}`}
          >
            Workflows
          </Link>
          <Link
            href="/app/transactions"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 px-3 rounded ${isTransactions ? "bg-[#101316] text-[#F2F3F1] font-semibold" : "text-[#969B9E]"}`}
          >
            Transactions
          </Link>
          <div className="pt-2 border-t border-white/[0.06]">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 text-[#969B9E] hover:text-[#F2F3F1]"
            >
              Homepage ↗
            </Link>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN APPLICATION VIEWPORT */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Control Bar */}
        <header className="hidden md:flex items-center justify-between h-13 px-6 border-b border-white/[0.06] bg-[#080A0B] text-xs font-mono">
          <div className="flex items-center gap-2 text-[#969B9E]">
            <span className="text-[#F2F3F1] font-semibold">{breadcrumb}</span>
          </div>

          <div className="flex items-center gap-4 text-[#969B9E]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A5F36B]"></span>
              <span>PostgreSQL store active</span>
            </span>
            <span className="text-white/20">|</span>
            <Link
              href="/"
              className="hover:text-[#F2F3F1] transition-colors flex items-center gap-1"
            >
              <span>Homepage</span>
              <span>↗</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
