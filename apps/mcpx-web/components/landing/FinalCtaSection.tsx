"use client";

import Link from "next/link";

export default function FinalCtaSection() {
  return (
    <section
      id="final-cta"
      className="py-20 sm:py-28 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-center space-y-6 relative z-10"
    >
      <h2 className="text-[34px] sm:text-[46px] md:text-[52px] font-bold text-foreground tracking-[-0.04em] leading-[1.05] overflow-hidden">
        <span className="block overflow-hidden py-1">
          <span className="final-cta-line block">Run workflows that know what actually happened.</span>
        </span>
      </h2>
      <p className="text-base sm:text-lg text-muted max-w-135 mx-auto leading-relaxed">
        Connect WebMCP applications and execute consequential workflows with durable state, reconciliation, and controlled rollback.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/app"
          className="px-5 py-2.5 rounded bg-foreground text-background hover:bg-white font-semibold text-sm transition-colors cursor-pointer shadow-sm"
        >
          Open MCPx →
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 rounded text-foreground bg-white/4 hover:bg-white/8 border border-white/9 font-medium text-sm transition-colors cursor-pointer"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}
