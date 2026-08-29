"use client";

import { forwardRef, useState } from "react";
import Link from "next/link";

interface LandingHeaderProps {
  // Pass any header configuration or callbacks if needed
}

export const LandingHeader = forwardRef<HTMLElement, LandingHeaderProps>(
  function LandingHeader(props, ref) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
      <header
        ref={ref}
        className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-white/8 transition-colors duration-200"
      >
        <div className="max-w-330 mx-auto px-4 sm:px-6 md:px-8 h-17.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4 items-center justify-center">
              <span className="w-1.5 h-1.5 bg-accent-lime group-hover:scale-110 transition-transform" />
              <span className="w-1.5 h-1.5 bg-current opacity-90" />
              <span className="w-1.5 h-1.5 bg-current opacity-35" />
              <span className="w-1.5 h-1.5 bg-current opacity-80" />
            </div>
            <span className="font-bold text-base tracking-tight text-current">
              MCPx
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium opacity-85">
            <a href="#product" className="hover:opacity-100 transition-opacity">
              Product
            </a>
            <a href="#reliability" className="hover:opacity-100 transition-opacity">
              Reliability
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-100 transition-opacity"
            >
              GitHub
            </a>
            <Link
              href="/app"
              className="px-3.5 py-1.5 rounded bg-foreground text-background hover:bg-white font-semibold text-xs transition-all cursor-pointer shadow-sm ml-2"
            >
              Open MCPx
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/app"
              className="px-3 py-1 rounded bg-foreground text-background font-semibold text-xs"
            >
              App
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-h-10 min-w-10 flex items-center justify-center rounded border border-white/10 bg-white/4 text-foreground cursor-pointer"
              aria-label="Toggle menu"
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
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-panel border-b border-white/8 px-5 py-4 space-y-3 font-mono text-xs">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-foreground"
            >
              Product
            </a>
            <a
              href="#reliability"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-foreground"
            >
              Reliability
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="block py-1.5 text-foreground"
            >
              GitHub
            </a>
            <div className="pt-2">
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 px-4 rounded bg-foreground text-background font-bold text-center block text-xs"
              >
                Open MCPx →
              </Link>
            </div>
          </div>
        )}
      </header>
    );
  }
);

LandingHeader.displayName = "LandingHeader";
export default LandingHeader;
