"use client";

import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/8 py-12 px-4 sm:px-6 md:px-8 max-w-330 mx-auto text-xs text-subtle font-mono relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/4">
        <div className="md:col-span-2 space-y-2 font-sans">
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
              <span className="w-1.5 h-1.5 bg-accent-lime" />
              <span className="w-1.5 h-1.5 bg-white/80" />
              <span className="w-1.5 h-1.5 bg-white/40" />
              <span className="w-1.5 h-1.5 bg-white/80" />
            </div>
            <span className="text-foreground font-bold text-sm">MCPx</span>
          </div>
          <p className="text-xs text-muted max-w-sm leading-relaxed">
            Reliable transactions for WebMCP. Durable execution, authoritative reconciliation, and human-gated rollback.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-foreground uppercase tracking-wider">[ NAVIGATION ]</div>
          <div className="space-y-1 text-xs text-muted flex flex-col">
            <a href="#product" className="hover:text-foreground py-0.5">Product</a>
            <a href="#reliability" className="hover:text-foreground py-0.5">Reliability</a>
            <Link href="/app" className="hover:text-foreground py-0.5">Open MCPx</Link>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-foreground uppercase tracking-wider">[ PLATFORM ]</div>
          <div className="space-y-1 text-xs text-muted flex flex-col">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground py-0.5">GitHub</a>
            <Link href="/app/services/new" className="hover:text-foreground py-0.5">Connect Service</Link>
            <Link href="/app/workflows/new" className="hover:text-foreground py-0.5">Workflow Builder</Link>
          </div>
        </div>
      </div>

      <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <span>APACHE-2.0 OPEN SOURCE</span>
        <span>WEBMCP TRANSACTION RUNTIME</span>
      </div>
    </footer>
  );
}
