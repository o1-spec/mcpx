"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function HomePage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Scrollytelling / Hero runtime visual state
  const [heroTraceStage, setHeroTraceStage] = useState<0 | 1 | 2 | 3>(0);
  const [scrollyStage, setScrollyStage] = useState<0 | 1 | 2 | 3>(0);
  const [dagCompensating, setDagCompensating] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Hero auto-cycling trace timer (controlled 3.2s interval)
  useEffect(() => {
    if (isReducedMotion) return;
    const interval = setInterval(() => {
      setHeroTraceStage((prev) => ((prev + 1) % 4) as 0 | 1 | 2 | 3);
    }, 3200);
    return () => clearInterval(interval);
  }, [isReducedMotion]);

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReduced = mediaQuery.matches;
    setIsReducedMotion(prefersReduced);

    // Check sessionStorage for first visit loader
    const hasSeenIntro = sessionStorage.getItem("mcpx_intro_seen");
    const shouldPlayLoader = !hasSeenIntro && !prefersReduced;

    if (shouldPlayLoader) {
      setShowLoader(true);
      sessionStorage.setItem("mcpx_intro_seen", "true");
    }

    if (prefersReduced) {
      return;
    }

    // 1. Initialize Lenis Smooth Scroll on desktop
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    let lenis: Lenis | null = null;

    if (!isTouchDevice && window.innerWidth >= 1024) {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
      });

      lenis.on("scroll", ScrollTrigger.update);
      const updateRaf = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(updateRaf);
      gsap.ticker.lagSmoothing(0);
    }

    // Handle smooth anchor clicks
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.hash && anchor.hash.startsWith("#")) {
        const elem = document.querySelector(anchor.hash);
        if (elem) {
          e.preventDefault();
          setMobileMenuOpen(false);
          if (lenis) {
            lenis.scrollTo(elem as HTMLElement, { offset: -70, duration: 1.1 });
          } else {
            elem.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    };
    document.addEventListener("click", handleAnchorClick);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // 2. Scroll Progress Line
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: mainRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.2,
          },
        });
      }

      // 3. Hero Layered Entrance
      const heroTl = gsap.timeline({
        paused: shouldPlayLoader,
      });

      heroTl
        .fromTo(
          headerRef.current,
          { y: -12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
          0
        )
        .fromTo(
          ".hero-eyebrow",
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
          0.1
        )
        .fromTo(
          ".hero-headline-line",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.85, stagger: 0.08, ease: "power3.out" },
          0.2
        )
        .fromTo(
          ".hero-supporting",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
          0.45
        )
        .fromTo(
          ".hero-buttons",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
          0.55
        )
        .fromTo(
          ".hero-runtime-panel",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          0.3
        )
        .fromTo(
          ".hero-proof-cell",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" },
          0.65
        );

      // 4. Initial System Boot Loader
      if (shouldPlayLoader && loaderRef.current) {
        const loaderTl = gsap.timeline({
          onComplete: () => {
            gsap.to(loaderRef.current, {
              opacity: 0,
              duration: 0.35,
              ease: "power2.inOut",
              onComplete: () => {
                setShowLoader(false);
              },
            });
            heroTl.play();
          },
        });

        loaderTl
          .fromTo(
            ".loader-grid-line",
            { scaleX: 0, transformOrigin: "center center" },
            { scaleX: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" },
            0.1
          )
          .fromTo(
            ".loader-center-node",
            { scale: 0.6, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" },
            0.3
          )
          .fromTo(
            ".loader-wordmark",
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
            0.45
          )
          .to({}, { duration: 0.25 });
      }

      // 5. GSAP matchMedia Choreography
      mm.add("(min-width: 1024px)", () => {
        ScrollTrigger.create({
          trigger: "#uncertainty-scrolly-section",
          start: "top top",
          end: "+=180%",
          pin: true,
          pinSpacing: true,
          snap: {
            snapTo: [0, 0.33, 0.66, 1],
            duration: { min: 0.2, max: 0.4 },
            delay: 0.05,
            ease: "power1.inOut",
          },
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.22) setScrollyStage(0);
            else if (p < 0.55) setScrollyStage(1);
            else if (p < 0.82) setScrollyStage(2);
            else setScrollyStage(3);
          },
        });
      });

      mm.add("(max-width: 1023px)", () => {
        ScrollTrigger.create({
          trigger: "#uncertainty-scrolly-section",
          start: "top 60px",
          end: "+=150%",
          pin: true,
          pinSpacing: true,
          snap: {
            snapTo: [0, 0.33, 0.66, 1],
            duration: { min: 0.15, max: 0.3 },
            delay: 0.08,
            ease: "power1.out",
          },
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.22) setScrollyStage(0);
            else if (p < 0.55) setScrollyStage(1);
            else if (p < 0.82) setScrollyStage(2);
            else setScrollyStage(3);
          },
        });
      });

      // Section 3 Capabilities Stagger
      gsap.fromTo(
        ".capability-cell",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: "#capabilities", start: "top 80%" },
        }
      );

      // Section 5 Reference DAG Line Reveal
      const dagTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#reference-workflow",
          start: "top 75%",
        },
      });

      dagTl
        .fromTo(
          ".dag-node-1",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        )
        .fromTo(
          ".dag-node-2",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          "+=0.1"
        )
        .fromTo(
          ".dag-node-3, .dag-node-4",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
          "+=0.1"
        );

      // Dark to Light Navbar Adaptation on #ground-truth
      ScrollTrigger.create({
        trigger: "#ground-truth",
        start: "top 70px",
        end: "bottom 70px",
        onEnter: () => {
          if (headerRef.current) {
            headerRef.current.classList.add("bg-[#F2F2EE]/95", "text-[#111210]", "border-black/[0.08]");
            headerRef.current.classList.remove("bg-[#070708]/90", "border-white/[0.08]");
          }
        },
        onLeave: () => {
          if (headerRef.current) {
            headerRef.current.classList.remove("bg-[#F2F2EE]/95", "text-[#111210]", "border-black/[0.08]");
            headerRef.current.classList.add("bg-[#070708]/90", "border-white/[0.08]");
          }
        },
        onEnterBack: () => {
          if (headerRef.current) {
            headerRef.current.classList.add("bg-[#F2F2EE]/95", "text-[#111210]", "border-black/[0.08]");
            headerRef.current.classList.remove("bg-[#070708]/90", "border-white/[0.08]");
          }
        },
        onLeaveBack: () => {
          if (headerRef.current) {
            headerRef.current.classList.remove("bg-[#F2F2EE]/95", "text-[#111210]", "border-black/[0.08]");
            headerRef.current.classList.add("bg-[#070708]/90", "border-white/[0.08]");
          }
        },
      });

      // Final CTA Mask Reveal
      gsap.fromTo(
        ".final-cta-line",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#final-cta",
            start: "top 80%",
          },
        }
      );
    }, mainRef);

    // Debounced Resize Handler
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", handleAnchorClick);
      if (lenis) lenis.destroy();
      ctx.revert();
    };
  }, [showLoader]);

  return (
    <div
      ref={mainRef}
      className="min-h-screen bg-[#070708] text-[#F5F5F3] font-sans selection:bg-[#A5F36B] selection:text-[#070708] relative overflow-x-hidden"
    >
      {/* Global Background Engineering Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-40">
        <div className="w-full h-full max-w-[1320px] mx-auto border-x border-white/[0.045] grid grid-cols-4 md:grid-cols-8 divide-x divide-white/[0.035]" />
      </div>

      {/* 0. Scroll Progress Line */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 right-0 h-[1.5px] bg-[#A5F36B] z-50 origin-left scale-x-0 pointer-events-none opacity-90"
      />

      {/* ============================================================ */}
      {/* INITIAL SYSTEM LOADER */}
      {/* ============================================================ */}
      {showLoader && (
        <div
          ref={loaderRef}
          onClick={() => setShowLoader(false)}
          className="fixed inset-0 z-[100] bg-[#070708] flex flex-col items-center justify-center select-none cursor-pointer p-4"
        >
          <div className="relative flex flex-col items-center justify-center space-y-5">
            <div className="w-24 h-24 relative flex items-center justify-center">
              <div className="loader-grid-line absolute w-full h-[1px] bg-white/20"></div>
              <div className="loader-grid-line absolute h-full w-[1px] bg-white/20"></div>
              <div className="loader-center-node w-5 h-5 bg-[#0C0E0F] border border-[#A5F36B] flex items-center justify-center z-10 shadow-[0_0_12px_rgba(165,243,107,0.3)]">
                <span className="w-1.5 h-1.5 bg-[#A5F36B]"></span>
              </div>
            </div>

            <div className="loader-wordmark flex items-center gap-2 font-mono text-[12px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A5F36B] animate-ping"></span>
              <span className="font-bold text-[#F5F5F3] tracking-tight">MCPx // RUNTIME BOOT</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. TOP NAVBAR — STRAIGHT, CLEAN, VERCEL-STRUCTURED */}
      {/* ============================================================ */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-[#070708]/90 backdrop-blur-md border-b border-white/[0.08] transition-colors duration-200"
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 h-[70px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4 items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#A5F36B] group-hover:scale-110 transition-transform"></span>
              <span className="w-1.5 h-1.5 bg-current opacity-90"></span>
              <span className="w-1.5 h-1.5 bg-current opacity-35"></span>
              <span className="w-1.5 h-1.5 bg-current opacity-80"></span>
            </div>
            <span className="font-bold text-[16px] tracking-tight text-current">
              MCPx
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium opacity-85">
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
              className="px-3.5 py-1.5 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[13px] transition-all cursor-pointer shadow-sm ml-2"
            >
              Open MCPx
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/app"
              className="px-3 py-1 rounded bg-[#F5F5F3] text-[#070708] font-semibold text-[12px]"
            >
              App
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded border border-white/[0.1] bg-white/[0.04] text-[#F5F5F3] cursor-pointer"
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
          <div className="md:hidden bg-[#0B0C0E] border-b border-white/[0.08] px-5 py-4 space-y-3 font-mono text-[13px]">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-[#F5F5F3]"
            >
              Product
            </a>
            <a
              href="#reliability"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-[#F5F5F3]"
            >
              Reliability
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="block py-1.5 text-[#F5F5F3]"
            >
              GitHub
            </a>
            <div className="pt-2">
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 px-4 rounded bg-[#F5F5F3] text-[#070708] font-bold text-center block text-[13px]"
              >
                Open MCPx →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION — QUEUEWATCH/VERCEL SPLIT CONTROL SURFACE */}
      {/* ============================================================ */}
      <section
        id="hero-section"
        className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto min-h-[calc(100vh-5rem)] flex flex-col justify-between relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-2 sm:pt-6">
          {/* LEFT COLUMN (~48%): OVERSIZED EDITORIAL HERO */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="hero-eyebrow flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#A5F36B]"></span>
              <span className="text-[12px] text-[#A0A0A4] font-mono uppercase tracking-wider">
                [ WEBMCP RELIABILITY RUNTIME ]
              </span>
            </div>

            {/* Left-Aligned Headline */}
            <h1 className="text-[44px] sm:text-[56px] md:text-[64px] lg:text-[72px] font-bold text-[#F5F5F3] tracking-[-0.055em] leading-[0.95]">
              <span className="block overflow-hidden">
                <span className="hero-headline-line block">WebMCP,</span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-headline-line block">without the</span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-headline-line block text-[#F5F5F3]">guesswork.</span>
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="hero-supporting text-[17px] sm:text-[19px] text-[#A0A0A4] max-w-[560px] leading-[1.5] font-normal">
              MCPx runs consequential WebMCP workflows as durable transactions — recovering uncertain writes, reconciling authoritative state, and safely rolling back partial failures.
            </p>

            {/* Vercel-like Action Buttons */}
            <div className="hero-buttons flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/app"
                className="px-5 py-2.5 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[13.5px] transition-colors cursor-pointer shadow-sm flex items-center gap-2"
              >
                <span>Open MCPx</span>
                <span>→</span>
              </Link>
              <Link
                href="/app"
                className="px-5 py-2.5 rounded text-[#F5F5F3] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] font-medium text-[13.5px] transition-colors cursor-pointer"
              >
                Run reference demo
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2.5 text-[#66686D] hover:text-[#F5F5F3] font-mono text-[13px] transition-colors ml-1"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN (~52%): LIVE RELIABILITY RUNTIME PANEL */}
          <div className="lg:col-span-6">
            <div className="hero-runtime-panel border border-white/[0.09] bg-[#0B0C0E] p-5 sm:p-7 relative font-mono text-[12px] space-y-5">
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-[11px]">
                <div className="flex items-center gap-2 text-[#F5F5F3] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#A5F36B] animate-pulse"></span>
                  <span>LIVE TRANSACTION</span>
                </div>
                <span className="text-[#66686D]">RUNTIME // ACTIVE</span>
              </div>

              {/* 4-Stage Transaction Trace */}
              <div className="space-y-3">
                {/* Stage 01: Execute */}
                <div
                  onClick={() => setHeroTraceStage(0)}
                  className={`p-3.5 border transition-all cursor-pointer ${
                    heroTraceStage === 0
                      ? "border-white/30 bg-[#0F1012] text-[#F5F5F3]"
                      : "border-white/[0.04] bg-[#070708] text-[#66686D] opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] pb-1">
                    <span className="text-[#A0A0A4]">01 · EXECUTE</span>
                    <span className={heroTraceStage === 0 ? "text-[#A5F36B]" : "text-[#66686D]"}>
                      create_route()
                    </span>
                  </div>
                  <div className="text-[12px] text-[#F5F5F3]">
                    Request dispatched across origin boundary
                  </div>
                </div>

                {/* Stage 02: Outcome Unknown (IN_DOUBT) */}
                <div
                  onClick={() => setHeroTraceStage(1)}
                  className={`p-3.5 border transition-all cursor-pointer ${
                    heroTraceStage === 1
                      ? "border-amber-500/60 bg-amber-950/20 text-amber-300"
                      : "border-white/[0.04] bg-[#070708] text-[#66686D] opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] pb-1">
                    <span className="text-[#A0A0A4]">02 · OUTCOME UNKNOWN</span>
                    <span className="text-amber-400 font-semibold">IN_DOUBT</span>
                  </div>
                  <div className="text-[12px] text-amber-200">
                    Transport acknowledgement lost · Mutation not repeated
                  </div>
                </div>

                {/* Stage 03: Authoritative Inspection */}
                <div
                  onClick={() => setHeroTraceStage(2)}
                  className={`p-3.5 border transition-all cursor-pointer ${
                    heroTraceStage === 2
                      ? "border-cyan-500/60 bg-cyan-950/20 text-cyan-300"
                      : "border-white/[0.04] bg-[#070708] text-[#66686D] opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] pb-1">
                    <span className="text-[#A0A0A4]">03 · AUTHORITATIVE INSPECTION</span>
                    <span className="text-cyan-400">get_route(operationKey)</span>
                  </div>
                  <div className="text-[12px] text-cyan-200">
                    Querying target state owner: exists: true
                  </div>
                </div>

                {/* Stage 04: Recovery */}
                <div
                  onClick={() => setHeroTraceStage(3)}
                  className={`p-3.5 border transition-all cursor-pointer ${
                    heroTraceStage === 3
                      ? "border-[#A5F36B]/60 bg-emerald-950/20 text-[#A5F36B]"
                      : "border-white/[0.04] bg-[#070708] text-[#66686D] opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] pb-1">
                    <span className="text-[#A0A0A4]">04 · RECOVERY</span>
                    <span className="text-[#A5F36B] font-semibold">✓ RECOVERED</span>
                  </div>
                  <div className="text-[12px] text-[#F5F5F3]">
                    Resource confirmed · Reconciled without duplicate mutation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HERO BOTTOM PROOF STRIP — 4-COLUMN GRID */}
        <div className="w-full pt-12 sm:pt-16 pb-2 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-t border-white/[0.08] relative z-10 mt-8">
          <div className="hero-proof-cell px-4 py-3 sm:py-2">
            <div className="text-[14px] sm:text-[15px] font-semibold text-[#F5F5F3]">
              WebMCP-native
            </div>
            <div className="text-[12px] text-[#A0A0A4] font-mono mt-0.5">
              Cross-origin execution
            </div>
          </div>

          <div className="hero-proof-cell px-4 py-3 sm:py-2">
            <div className="text-[14px] sm:text-[15px] font-semibold text-[#F5F5F3]">
              Durable state
            </div>
            <div className="text-[12px] text-[#A0A0A4] font-mono mt-0.5">
              PostgreSQL-backed
            </div>
          </div>

          <div className="hero-proof-cell px-4 py-3 sm:py-2">
            <div className="text-[14px] sm:text-[15px] font-semibold text-[#F5F5F3]">
              Authoritative
            </div>
            <div className="text-[12px] text-[#A0A0A4] font-mono mt-0.5">
              Reconciliation
            </div>
          </div>

          <div className="hero-proof-cell px-4 py-3 sm:py-2">
            <div className="text-[14px] sm:text-[15px] font-semibold text-[#F5F5F3]">
              Human-controlled
            </div>
            <div className="text-[12px] text-[#A0A0A4] font-mono mt-0.5">
              Saga rollback
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SECTION 2 — THE PROBLEM (DISTRIBUTED UNCERTAINTY) */}
      {/* ============================================================ */}
      <section
        id="problem"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto border-t border-white/[0.08] relative z-10"
      >
        <div className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-[12px] font-mono text-[#A5F36B] uppercase tracking-wider">
              [ DISTRIBUTED UNCERTAINTY ]
            </span>
            <h2 className="text-[32px] sm:text-[44px] md:text-[48px] font-bold text-[#F5F5F3] tracking-[-0.04em] leading-[1.05]">
              A timeout doesn’t tell you what happened.
            </h2>
            <p className="text-[16px] sm:text-[17px] text-[#A0A0A4] leading-relaxed">
              A consequential write can commit successfully while its response disappears in transit. Retrying may duplicate the mutation. Assuming failure may corrupt state.
            </p>
          </div>

          {/* 3 Large Grid Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-white/[0.09] divide-y md:divide-y-0 md:divide-x divide-white/[0.09] bg-[#0B0C0E] font-mono text-[12px]">
            {/* Column 01 */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="text-[11px] text-[#66686D]">[ 01 ]</div>
              <div className="text-[16px] font-bold text-[#F5F5F3]">WRITE SENT</div>
              <div className="p-3 border border-white/[0.06] bg-[#070708] text-[#A0A0A4]">
                create_route(spec) →
              </div>
              <p className="text-[13px] text-[#A0A0A4] font-sans leading-relaxed">
                Mutation dispatched across origins to the state-owning service.
              </p>
            </div>

            {/* Column 02 */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="text-[11px] text-[#66686D]">[ 02 ]</div>
              <div className="text-[16px] font-bold text-amber-300">ACK LOST</div>
              <div className="p-3 border border-amber-500/30 bg-amber-950/20 text-amber-300 font-semibold">
                ? IN_DOUBT
              </div>
              <p className="text-[13px] text-[#A0A0A4] font-sans leading-relaxed">
                Response packet dropped. Runtime halts blind retry to prevent duplicate creation.
              </p>
            </div>

            {/* Column 03 */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="text-[11px] text-[#66686D]">[ 03 ]</div>
              <div className="text-[16px] font-bold text-[#A5F36B]">GROUND TRUTH</div>
              <div className="p-3 border border-[#A5F36B]/30 bg-emerald-950/20 text-[#A5F36B] font-semibold">
                get_route(opKey) → RECOVERED
              </div>
              <p className="text-[13px] text-[#A0A0A4] font-sans leading-relaxed">
                Authoritative query discovers resource exists. Reconciled safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SECTION 3 — CORE CAPABILITIES (4-COLUMN ARCHITECTURE) */}
      {/* ============================================================ */}
      <section
        id="capabilities"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto border-t border-white/[0.08] relative z-10"
      >
        <div className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-[12px] font-mono text-[#A5F36B] uppercase tracking-wider">
              [ RELIABILITY PRIMITIVES ]
            </span>
            <h2 className="text-[32px] sm:text-[44px] md:text-[48px] font-bold text-[#F5F5F3] tracking-[-0.04em] leading-[1.05]">
              Reliability primitives, not retry wrappers.
            </h2>
            <p className="text-[16px] sm:text-[17px] text-[#A0A0A4] leading-relaxed">
              Every consequential WebMCP operation implements deterministic execution, inspection, and reverse compensation contracts.
            </p>
          </div>

          {/* 4 Capability Grid Cells */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/[0.09] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.09] bg-[#0B0C0E] font-mono text-[12px]">
            {/* Cell 01: Execute */}
            <div className="capability-cell p-6 sm:p-7 space-y-4">
              <div className="h-14 border-b border-white/[0.06] flex items-center justify-between text-[11px] text-[#66686D]">
                <span>[ 01 ]</span>
                <span className="text-[#F5F5F3]">EXECUTE</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#F5F5F3]">Operation Identity</h3>
              <p className="text-[13px] text-[#A0A0A4] font-sans leading-relaxed">
                Bind consequential actions to a stable operation identity across origins.
              </p>
            </div>

            {/* Cell 02: Inspect */}
            <div className="capability-cell p-6 sm:p-7 space-y-4">
              <div className="h-14 border-b border-white/[0.06] flex items-center justify-between text-[11px] text-[#66686D]">
                <span>[ 02 ]</span>
                <span className="text-cyan-400">INSPECT</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#F5F5F3]">Authoritative Inspection</h3>
              <p className="text-[13px] text-[#A0A0A4] font-sans leading-relaxed">
                Ask the application that owns the resource what actually exists.
              </p>
            </div>

            {/* Cell 03: Reconcile */}
            <div className="capability-cell p-6 sm:p-7 space-y-4">
              <div className="h-14 border-b border-white/[0.06] flex items-center justify-between text-[11px] text-[#66686D]">
                <span>[ 03 ]</span>
                <span className="text-[#A5F36B]">RECONCILE</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#F5F5F3]">Uncertainty Recovery</h3>
              <p className="text-[13px] text-[#A0A0A4] font-sans leading-relaxed">
                Resolve uncertain outcomes through authoritative inspection instead of blindly repeating the mutation.
              </p>
            </div>

            {/* Cell 04: Compensate */}
            <div className="capability-cell p-6 sm:p-7 space-y-4">
              <div className="h-14 border-b border-white/[0.06] flex items-center justify-between text-[11px] text-[#66686D]">
                <span>[ 04 ]</span>
                <span className="text-amber-400">COMPENSATE</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#F5F5F3]">Verified Compensation</h3>
              <p className="text-[13px] text-[#A0A0A4] font-sans leading-relaxed">
                Undo completed work in reverse dependency order and inspect again to verify absence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. SECTION 4 — WHY MCPX (COMPARISON SECTION) */}
      {/* ============================================================ */}
      <section
        id="reliability"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto border-t border-white/[0.08] relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Large Copy */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[12px] font-mono text-[#A5F36B] uppercase tracking-wider">
              [ COMPARISON // RUNTIME ]
            </span>
            <h2 className="text-[30px] sm:text-[40px] font-bold text-[#F5F5F3] tracking-[-0.04em] leading-[1.08]">
              Naive retry logic treats a timeout like failure.
            </h2>
            <h3 className="text-[24px] sm:text-[32px] font-bold text-[#F5F5F3] tracking-[-0.03em] leading-[1.1]">
              MCPx treats <span className="text-[#A5F36B]">uncertainty</span> as a state.
            </h3>
            <p className="text-[15px] sm:text-[16px] text-[#A0A0A4] leading-relaxed pt-1">
              Instead of guessing whether a consequential write succeeded, MCPx reconciles against authoritative service state before progressing or compensating.
            </p>
          </div>

          {/* Right Split Comparison */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 border border-white/[0.09] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.09] bg-[#0B0C0E] font-mono text-[11.5px]">
            {/* Left: Traditional Retry Logic */}
            <div className="p-6 space-y-4">
              <div className="text-[11px] text-[#66686D] border-b border-white/[0.06] pb-2">
                TRADITIONAL RETRY LOGIC
              </div>
              <div className="space-y-2 text-[#A0A0A4]">
                <div>Request timeout</div>
                <div className="text-center text-[#66686D]">↓</div>
                <div className="text-rose-400 font-semibold">FAILED (Assumed)</div>
                <div className="text-center text-[#66686D]">↓</div>
                <div>Blind retry mutation</div>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-rose-300 font-sans text-[12px]">
                Risk: Duplicate writes & orphaned resources.
              </div>
            </div>

            {/* Right: MCPx Runtime */}
            <div className="p-6 space-y-4 bg-[#0F1012]">
              <div className="text-[11px] text-[#A5F36B] border-b border-white/[0.06] pb-2">
                MCPX RELIABILITY RUNTIME
              </div>
              <div className="space-y-2">
                <div className="text-[#F5F5F3]">Request timeout</div>
                <div className="text-center text-[#66686D]">↓</div>
                <div className="text-amber-400 font-semibold">IN_DOUBT (Uncertain)</div>
                <div className="text-center text-[#66686D]">↓</div>
                <div className="text-cyan-300">Inspect authoritative state</div>
                <div className="text-center text-[#66686D]">↓</div>
                <div className="text-[#A5F36B] font-semibold">✓ RECOVERED</div>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-[#A5F36B] font-sans text-[12px]">
                Result: Resource confirmed without reissuing mutation.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. SECTION 5 — REFERENCE TRANSACTION (PINNED SCHEMATIC) */}
      {/* ============================================================ */}
      <div id="uncertainty-scrolly-section" className="border-t border-white/[0.08] relative">
        <section
          id="reference-workflow"
          className="min-h-auto lg:min-h-screen py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto flex flex-col justify-center relative z-10"
        >
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="text-[12px] font-mono text-[#A5F36B] uppercase tracking-wider">
                  [ 04 · REFERENCE TOPOLOGY ]
                </span>
                <h2 className="text-[32px] sm:text-[44px] font-bold text-[#F5F5F3] tracking-[-0.04em] leading-[1.05]">
                  Watch a distributed transaction fail safely.
                </h2>
                <p className="text-[15px] sm:text-[16px] text-[#A0A0A4] leading-relaxed">
                  The included reference workflow runs across four independent WebMCP services to demonstrate cross-origin execution, reconciliation, and human-approved Saga rollback.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDagCompensating(!dagCompensating)}
                  className="px-3.5 py-1.5 rounded font-mono text-[12px] bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                >
                  {dagCompensating ? "Reset execution" : "Trigger Saga compensation"}
                </button>
                <Link
                  href="/app"
                  className="px-3.5 py-1.5 rounded font-mono text-[12px] bg-[#F5F5F3] text-[#070708] hover:bg-white transition-colors"
                >
                  Run in app
                </Link>
              </div>
            </div>

            {/* Blueprint DAG Schematic Canvas */}
            <div className="border border-white/[0.09] bg-[#0B0C0E] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 font-mono text-[11px] text-[#66686D]">
                <span>TOPOLOGY // 4 SERVICES</span>
                <span>STATUS: {dagCompensating ? "COMPENSATED" : "ACTIVE"}</span>
              </div>

              {/* Node Layout */}
              <div className="space-y-4 max-w-lg mx-auto py-2 font-mono text-[12px]">
                {/* Node 1: Database */}
                <div className="dag-node-1 border border-white/[0.08] bg-[#070708] p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] text-[#66686D] block">[01] DATABASE</span>
                    <span className="text-[#F5F5F3]">create_database()</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] border ${dagCompensating ? "bg-white/[0.04] text-[#66686D] border-white/[0.08]" : "bg-emerald-950/60 text-[#A5F36B] border-[#A5F36B]/30"}`}>
                    {dagCompensating ? "COMPENSATED" : "✓ SUCCEEDED"}
                  </span>
                </div>

                <div className="flex justify-center">
                  <div className="h-5 w-[1px] bg-white/[0.1]"></div>
                </div>

                {/* Node 2: Backend */}
                <div className="dag-node-2 border border-white/[0.08] bg-[#070708] p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] text-[#66686D] block">[02] BACKEND</span>
                    <span className="text-[#F5F5F3]">deploy_backend()</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] border ${dagCompensating ? "bg-white/[0.04] text-[#66686D] border-white/[0.08]" : "bg-emerald-950/60 text-[#A5F36B] border-[#A5F36B]/30"}`}>
                    {dagCompensating ? "COMPENSATED" : "✓ SUCCEEDED"}
                  </span>
                </div>

                <div className="flex justify-center items-center gap-28 sm:gap-40 py-1">
                  <span className="h-5 w-[1px] bg-white/[0.1] -rotate-25 transform origin-top"></span>
                  <span className="h-5 w-[1px] bg-white/[0.1] rotate-25 transform origin-top"></span>
                </div>

                {/* Nodes 3 & 4: Routing & Frontend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="dag-node-3 border border-amber-500/40 bg-[#070708] p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] text-[#66686D]">[03] ROUTING</span>
                      <span className="text-[10px] text-[#A5F36B]">RECOVERED</span>
                    </div>
                    <div className="text-[#F5F5F3]">create_route()</div>
                  </div>

                  <div className="dag-node-4 border border-rose-500/40 bg-[#070708] p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] text-[#66686D]">[04] FRONTEND</span>
                      <span className="text-[10px] text-rose-400">FAILED</span>
                    </div>
                    <div className="text-[#F5F5F3]">deploy_frontend()</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================ */}
      {/* 7. SECTION 6 — HUMAN CONTROL (DESTRUCTIVE ROLLBACK) */}
      {/* ============================================================ */}
      <section
        id="human-control"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto border-t border-white/[0.08] relative z-10"
      >
        <div className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-[12px] font-mono text-[#A5F36B] uppercase tracking-wider">
              [ SAFETY GATE ]
            </span>
            <h2 className="text-[32px] sm:text-[44px] font-bold text-[#F5F5F3] tracking-[-0.04em] leading-[1.05]">
              Destructive rollback stays human-controlled.
            </h2>
            <p className="text-[16px] text-[#A0A0A4] leading-relaxed">
              When downstream steps fail, MCPx calculates safe reverse-order deletion and halts for human approval before removing live resources.
            </p>
          </div>

          {/* Operational Rollback State Panel */}
          <div className="border border-amber-500/40 bg-[#0B0C0E] p-6 sm:p-8 font-mono text-[12px] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-amber-300 font-bold uppercase">ROLLBACK APPROVAL REQUIRED</span>
              </div>
              <span className="text-[#A0A0A4]">FAILED STEP: [04] FRONTEND (NEVER COMMITTED)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-white/[0.06] bg-[#070708] space-y-2">
                <span className="text-[10.5px] text-[#66686D] uppercase block">
                  Resources currently present
                </span>
                <div className="space-y-1 text-[#F5F5F3]">
                  <div className="text-[#A5F36B]">✓ Database (PostgreSQL schema active)</div>
                  <div className="text-[#A5F36B]">✓ Backend (Compute runtime active)</div>
                  <div className="text-[#A5F36B]">✓ Routing (Gateway route active)</div>
                  <div className="text-[#66686D] pt-1">✕ Frontend (Never committed)</div>
                </div>
              </div>

              <div className="p-4 border border-white/[0.06] bg-[#070708] space-y-2">
                <span className="text-[10.5px] text-[#66686D] uppercase block">
                  Proposed rollback sequence
                </span>
                <div className="space-y-1 text-[#F5F5F3]">
                  <div>01 Routing gateway (delete_route)</div>
                  <div>02 Compute backend (delete_backend)</div>
                  <div>03 Database schema (CASCADE)</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/app"
                className="px-4 py-2 rounded bg-amber-400 hover:bg-amber-300 text-[#070708] font-bold text-[12px] transition-colors"
              >
                Approve rollback in app →
              </Link>
              <span className="text-[#66686D] text-[11px]">
                Resources remain active until explicitly approved by operator
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. SECTION 7 — DEVELOPER PLATFORM (GENERIC PROGRESSION) */}
      {/* ============================================================ */}
      <section
        id="product"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto border-t border-white/[0.08] relative z-10"
      >
        <div className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-[12px] font-mono text-[#A5F36B] uppercase tracking-wider">
              [ DEVELOPER PLATFORM ]
            </span>
            <h2 className="text-[32px] sm:text-[44px] font-bold text-[#F5F5F3] tracking-[-0.04em] leading-[1.05]">
              Bring your own WebMCP service.
            </h2>
            <p className="text-[16px] text-[#A0A0A4] leading-relaxed">
              Connect compatible applications, discover their tools, define reliability contracts, and compose them into multi-step workflows without modifying the MCPx runtime.
            </p>
          </div>

          {/* Connected Grid Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border border-white/[0.09] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.09] bg-[#0B0C0E] font-mono text-[12px]">
            <div className="p-5 space-y-2">
              <div className="text-[11px] text-[#66686D]">[ 01 ]</div>
              <div className="font-bold text-[#F5F5F3]">CONNECT</div>
              <div className="text-[11px] text-[#A0A0A4]">billing.example.com</div>
            </div>

            <div className="p-5 space-y-2">
              <div className="text-[11px] text-[#66686D]">[ 02 ]</div>
              <div className="font-bold text-[#F5F5F3]">DISCOVER</div>
              <div className="text-[11px] text-[#A5F36B]">6 tools found</div>
            </div>

            <div className="p-5 space-y-2">
              <div className="text-[11px] text-[#66686D]">[ 03 ]</div>
              <div className="font-bold text-[#F5F5F3]">CONTRACT</div>
              <div className="text-[11px] text-[#A0A0A4]">Execute / Inspect</div>
            </div>

            <div className="p-5 space-y-2">
              <div className="text-[11px] text-[#66686D]">[ 04 ]</div>
              <div className="font-bold text-[#F5F5F3]">COMPOSE</div>
              <div className="text-[11px] text-[#A0A0A4]">DAG Pipeline</div>
            </div>

            <div className="p-5 space-y-2 bg-[#0F1012]">
              <div className="text-[11px] text-[#A5F36B]">[ 05 ]</div>
              <div className="font-bold text-[#A5F36B]">RUN</div>
              <div className="text-[11px] text-[#F5F5F3]">Durable transaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. SECTION 8 — LIGHT CONTRAST SECTION ("Built around ground truth") */}
      {/* ============================================================ */}
      <section
        id="ground-truth"
        className="bg-[#F2F2EE] text-[#111210] py-20 sm:py-28 px-4 sm:px-6 md:px-8 border-y border-black/[0.08] selection:bg-[#111210] selection:text-[#F2F2EE] transition-colors duration-200 relative z-10"
      >
        <div className="max-w-[1320px] mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[12px] font-mono text-[#4D7C0F] uppercase tracking-wider">
              [ GROUND TRUTH THESIS ]
            </span>
            <h2 className="text-[36px] sm:text-[48px] font-bold text-[#111210] tracking-[-0.04em] leading-[1.05]">
              Built around ground truth.
            </h2>
            <p className="text-[16px] text-[#4B5563] leading-relaxed">
              Consequential systems cannot rely on optimistic transport. The application that owns the resource is the sole authority on state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/[0.08] border border-black/[0.08] bg-[#F2F2EE]">
            <div className="p-8 space-y-3">
              <h3 className="text-[20px] font-bold text-[#111210]">Unknown is not failure.</h3>
              <p className="text-[14px] text-[#4B5563] leading-relaxed">
                When transport acknowledgements drop, operations enter authoritative inspection rather than being written off as errors.
              </p>
            </div>

            <div className="p-8 space-y-3">
              <h3 className="text-[20px] font-bold text-[#111210]">Durability before UI state.</h3>
              <p className="text-[14px] text-[#4B5563] leading-relaxed">
                Every node transition, attempt, and inspection event is durably committed to PostgreSQL before downstream progression.
              </p>
            </div>

            <div className="p-8 space-y-3 border-t border-black/[0.08]">
              <h3 className="text-[20px] font-bold text-[#111210]">Compensation is verified.</h3>
              <p className="text-[14px] text-[#4B5563] leading-relaxed">
                Saga rollbacks execute in strict reverse dependency order and inspect remote state to confirm deletion occurred.
              </p>
            </div>

            <div className="p-8 space-y-3 border-t border-black/[0.08]">
              <h3 className="text-[20px] font-bold text-[#111210]">The application owns the truth.</h3>
              <p className="text-[14px] text-[#4B5563] leading-relaxed">
                MCPx never assumes external state; it queries the WebMCP application directly via its inspection contracts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. SECTION 9 — FINAL CALL TO ACTION */}
      {/* ============================================================ */}
      <section
        id="final-cta"
        className="py-20 sm:py-28 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-center space-y-6 relative z-10"
      >
        <h2 className="text-[34px] sm:text-[46px] md:text-[52px] font-bold text-[#F5F5F3] tracking-[-0.04em] leading-[1.05] overflow-hidden">
          <span className="block overflow-hidden py-1">
            <span className="final-cta-line block">Run workflows that know what actually happened.</span>
          </span>
        </h2>
        <p className="text-[16px] sm:text-[18px] text-[#A0A0A4] max-w-[540px] mx-auto leading-relaxed">
          Connect WebMCP applications and execute consequential workflows with durable state, reconciliation, and controlled rollback.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/app"
            className="px-5 py-2.5 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[13.5px] transition-colors cursor-pointer shadow-sm"
          >
            Open MCPx →
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded text-[#F5F5F3] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] font-medium text-[13.5px] transition-colors cursor-pointer"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 11. FOOTER — VERCEL-CLEAN GRID ALIGNED */}
      {/* ============================================================ */}
      <footer className="border-t border-white/[0.08] py-12 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto text-xs text-[#66686D] font-mono relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/[0.04]">
          <div className="md:col-span-2 space-y-2 font-sans">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <span className="w-1.5 h-1.5 bg-[#A5F36B]"></span>
                <span className="w-1.5 h-1.5 bg-white/80"></span>
                <span className="w-1.5 h-1.5 bg-white/40"></span>
                <span className="w-1.5 h-1.5 bg-white/80"></span>
              </div>
              <span className="text-[#F5F5F3] font-bold text-[15px]">MCPx</span>
            </div>
            <p className="text-[13px] text-[#A0A0A4] max-w-sm leading-relaxed">
              Reliable transactions for WebMCP. Durable execution, authoritative reconciliation, and human-gated rollback.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] text-[#F5F5F3] uppercase tracking-wider">[ NAVIGATION ]</div>
            <div className="space-y-1 text-[12px] text-[#A0A0A4] flex flex-col">
              <a href="#product" className="hover:text-[#F5F5F3] py-0.5">Product</a>
              <a href="#reliability" className="hover:text-[#F5F5F3] py-0.5">Reliability</a>
              <Link href="/app" className="hover:text-[#F5F5F3] py-0.5">Open MCPx</Link>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] text-[#F5F5F3] uppercase tracking-wider">[ PLATFORM ]</div>
            <div className="space-y-1 text-[12px] text-[#A0A0A4] flex flex-col">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#F5F5F3] py-0.5">GitHub</a>
              <Link href="/app/services/new" className="hover:text-[#F5F5F3] py-0.5">Connect Service</Link>
              <Link href="/app/workflows/new" className="hover:text-[#F5F5F3] py-0.5">Workflow Builder</Link>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px]">
          <span>APACHE-2.0 OPEN SOURCE</span>
          <span>WEBMCP TRANSACTION RUNTIME</span>
        </div>
      </footer>
    </div>
  );
}
