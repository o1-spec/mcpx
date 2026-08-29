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

    // Loader always runs on page load unless prefers-reduced-motion
    const shouldPlayLoader = !prefersReduced;

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
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
          0
        )
        .fromTo(
          ".hero-eyebrow",
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
          0.1
        )
        .fromTo(
          ".hero-headline-line",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" },
          0.18
        )
        .fromTo(
          ".hero-supporting",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" },
          0.4
        )
        .fromTo(
          ".hero-buttons",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
          0.5
        )
        .fromTo(
          ".hero-runtime-panel",
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
          0.3
        )
        .fromTo(
          ".hero-proof-cell",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power2.out" },
          0.6
        );

      // ============================================================
      // 4. MINIMAL GEOMETRIC STATE RESOLUTION LOADER (~1.3s)
      // ============================================================
      if (shouldPlayLoader && loaderRef.current) {
        const loaderTl = gsap.timeline({
          onComplete: () => {
            gsap.to(loaderRef.current, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.inOut",
              onComplete: () => {
                if (loaderRef.current) {
                  loaderRef.current.style.display = "none";
                }
              },
            });
            heroTl.play();
          },
        });

        loaderTl
          // 0.05s: Faint construction grid & central axes draw in
          .fromTo(
            ".loader-grid",
            { opacity: 0 },
            { opacity: 0.35, duration: 0.25, ease: "power2.out" },
            0.05
          )
          .fromTo(
            ".loader-axis-h",
            { scaleX: 0, transformOrigin: "center center" },
            { scaleX: 1, duration: 0.3, ease: "power2.out" },
            0.1
          )
          .fromTo(
            ".loader-axis-v",
            { scaleY: 0, transformOrigin: "center center" },
            { scaleY: 1, duration: 0.3, ease: "power2.out" },
            0.1
          )
          // 0.25s: MCPx 4 geometric tiles assemble (neutral first, lime last)
          .fromTo(
            [".loader-tile-1", ".loader-tile-2", ".loader-tile-3"],
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, stagger: 0.04, duration: 0.18, ease: "back.out(1.5)" },
            0.25
          )
          .fromTo(
            ".loader-tile-lime",
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.2, ease: "back.out(2)" },
            0.35
          )
          .fromTo(
            ".loader-brand-text",
            { opacity: 0, y: 3 },
            { opacity: 0.9, y: 0, duration: 0.2, ease: "power2.out" },
            0.4
          )
          // 0.50s: 4 outbound graph lines draw outward to endpoints
          .fromTo(
            [".loader-line-top", ".loader-line-bottom", ".loader-line-left", ".loader-line-right"],
            { strokeDasharray: 120, strokeDashoffset: 120 },
            { strokeDashoffset: 0, duration: 0.28, stagger: 0.03, ease: "power2.out" },
            0.5
          )
          .fromTo(
            [".loader-node-top", ".loader-node-bottom", ".loader-node-left", ".loader-node-right"],
            { scale: 0, transformOrigin: "center center" },
            { scale: 1, duration: 0.2, stagger: 0.03, ease: "back.out(1.7)" },
            0.65
          )
          // 0.75s: Uncertainty moment — Right branch fragments & turns subtle amber
          .to(
            ".loader-line-right",
            { stroke: "#F59E0B", strokeDasharray: "4 3", opacity: 0.75, duration: 0.15, ease: "power1.inOut" },
            0.75
          )
          .to(
            ".loader-node-right-outer",
            { stroke: "#F59E0B", duration: 0.15 },
            0.75
          )
          .to(
            ".loader-node-right-inner",
            { fill: "#F59E0B", duration: 0.15 },
            0.75
          )
          // 0.92s: Resolution moment — Inspection ray shoots outward and resolves connection
          .fromTo(
            ".loader-line-inspect",
            { opacity: 0, strokeDashoffset: 120, strokeDasharray: 120 },
            { opacity: 1, strokeDashoffset: 0, duration: 0.2, ease: "power2.inOut" },
            0.92
          )
          .to(
            ".loader-line-right",
            { stroke: "#A5F36B", strokeDasharray: "none", opacity: 1, duration: 0.15, ease: "power2.out" },
            1.05
          )
          .to(
            ".loader-node-right-outer",
            { stroke: "#A5F36B", scale: 1.25, transformOrigin: "center center", duration: 0.15, ease: "back.out(2)" },
            1.05
          )
          .to(
            ".loader-node-right-inner",
            { fill: "#A5F36B", duration: 0.15 },
            1.05
          )
          .to(
            ".loader-line-inspect",
            { opacity: 0, duration: 0.1 },
            1.15
          )
          // 1.15s: Graph locks in solid with micro-pulse & grid expands into homepage
          .to(
            ".loader-node-right-outer",
            { scale: 1, duration: 0.15, ease: "power2.out" },
            1.15
          )
          .to(
            ".loader-graph-container",
            { scale: 0.94, opacity: 0.85, duration: 0.2, ease: "power2.inOut" },
            1.2
          )
          .to(
            [".loader-axis-h", ".loader-axis-v"],
            { opacity: 0.05, duration: 0.25, ease: "power2.out" },
            1.22
          );
      } else {
        if (loaderRef.current) loaderRef.current.style.display = "none";
        heroTl.play();
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
            headerRef.current.classList.add("bg-[#F2F2EE]/95", "text-[#111210]", "border-black/8");
            headerRef.current.classList.remove("bg-background/90", "border-white/8");
          }
        },
        onLeave: () => {
          if (headerRef.current) {
            headerRef.current.classList.remove("bg-[#F2F2EE]/95", "text-[#111210]", "border-black/8");
            headerRef.current.classList.add("bg-background/90", "border-white/8");
          }
        },
        onEnterBack: () => {
          if (headerRef.current) {
            headerRef.current.classList.add("bg-[#F2F2EE]/95", "text-[#111210]", "border-black/8");
            headerRef.current.classList.remove("bg-background/90", "border-white/8");
          }
        },
        onLeaveBack: () => {
          if (headerRef.current) {
            headerRef.current.classList.remove("bg-[#F2F2EE]/95", "text-[#111210]", "border-black/8");
            headerRef.current.classList.add("bg-background/90", "border-white/8");
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
  }, []);

  return (
    <div
      ref={mainRef}
      className="min-h-screen bg-background text-foreground font-sans selection:bg-accent-lime selection:text-background relative overflow-x-hidden"
    >
      {/* Global Background Engineering Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-40">
        <div className="w-full h-full max-w-330 mx-auto border-x border-white/4.5 grid grid-cols-4 md:grid-cols-8 divide-x divide-white/3.5" />
      </div>

      {/* 0. Scroll Progress Line */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 right-0 h-[1.5px] bg-accent-lime z-50 origin-left scale-x-0 pointer-events-none opacity-90"
      />

      {/* ============================================================ */}
      {/* MINIMAL GEOMETRIC STATE RESOLUTION LOADER */}
      {/* ============================================================ */}
      <div
        ref={loaderRef}
        onClick={() => {
          if (loaderRef.current) {
            gsap.to(loaderRef.current, {
              opacity: 0,
              duration: 0.2,
              onComplete: () => {
                if (loaderRef.current) loaderRef.current.style.display = "none";
              },
            });
          }
        }}
        className="fixed inset-0 z-100 bg-background flex items-center justify-center select-none cursor-pointer p-4 overflow-hidden"
      >
        {/* Faint Architectural Background Construction Grid */}
        <div className="loader-grid absolute inset-0 pointer-events-none opacity-30">
          <div className="w-full h-full max-w-330 mx-auto border-x border-white/8 grid grid-cols-4 md:grid-cols-8 divide-x divide-white/6" />
        </div>

        {/* Central Axis Construction Lines */}
        <div className="loader-axis-h absolute w-full h-px bg-white/12 pointer-events-none" />
        <div className="loader-axis-v absolute h-full w-px bg-white/12 pointer-events-none" />

        {/* Center Transaction Graph Canvas */}
        <div className="loader-graph-container relative z-20 flex flex-col items-center justify-center pointer-events-none">
          <svg
            viewBox="0 0 360 360"
            className="w-65 h-65 sm:w-[320px] sm:h-80 overflow-visible"
          >
            {/* Branch Lines from center (180, 180) */}
            {/* Top Branch */}
            <line
              x1="180"
              y1="180"
              x2="180"
              y2="75"
              className="loader-line-top stroke-white/25 stroke-[1.5]"
            />
            {/* Bottom Branch */}
            <line
              x1="180"
              y1="180"
              x2="180"
              y2="285"
              className="loader-line-bottom stroke-white/25 stroke-[1.5]"
            />
            {/* Left Branch */}
            <line
              x1="180"
              y1="180"
              x2="75"
              y2="180"
              className="loader-line-left stroke-white/25 stroke-[1.5]"
            />
            {/* Right Branch (experiences uncertainty -> resolution) */}
            <line
              x1="180"
              y1="180"
              x2="285"
              y2="180"
              className="loader-line-right stroke-white/25 stroke-[1.5]"
            />
            {/* Active Inspection Pulse on Right Branch */}
            <line
              x1="180"
              y1="180"
              x2="285"
              y2="180"
              className="loader-line-inspect stroke-accent-lime stroke-2 opacity-0"
            />

            {/* Endpoint Nodes */}
            {/* Top Node */}
            <g className="loader-node-top" transform="translate(180, 75)">
              <circle r="4" className="fill-[#070708] stroke-white/40 stroke-[1.5]" />
              <circle r="1.5" className="fill-white/80" />
            </g>
            {/* Bottom Node */}
            <g className="loader-node-bottom" transform="translate(180, 285)">
              <circle r="4" className="fill-[#070708] stroke-white/40 stroke-[1.5]" />
              <circle r="1.5" className="fill-white/80" />
            </g>
            {/* Left Node */}
            <g className="loader-node-left" transform="translate(75, 180)">
              <circle r="4" className="fill-[#070708] stroke-white/40 stroke-[1.5]" />
              <circle r="1.5" className="fill-white/80" />
            </g>
            {/* Right Node (Uncertain -> Resolved) */}
            <g className="loader-node-right" transform="translate(285, 180)">
              <circle r="5" className="loader-node-right-outer fill-[#070708] stroke-white/40 stroke-[1.5]" />
              <circle r="2" className="loader-node-right-inner fill-white/80" />
            </g>
          </svg>

          {/* Central MCPx Geometric Mark */}
          <div className="loader-brand absolute inset-0 flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
            <div className="grid grid-cols-2 gap-1 w-6 h-6 items-center justify-center p-1 bg-background border border-white/20 rounded-sm">
              <span className="loader-tile-lime w-2 h-2 bg-accent-lime rounded-[0.5px]"></span>
              <span className="loader-tile-1 w-2 h-2 bg-foreground opacity-90 rounded-[0.5px]"></span>
              <span className="loader-tile-2 w-2 h-2 bg-foreground opacity-35 rounded-[0.5px]"></span>
              <span className="loader-tile-3 w-2 h-2 bg-foreground opacity-80 rounded-[0.5px]"></span>
            </div>
            <span className="loader-brand-text text-xs font-medium tracking-tight text-foreground font-sans opacity-90">
              MCPx
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. TOP NAVBAR — STRAIGHT, CLEAN, VERCEL-STRUCTURED */}
      {/* ============================================================ */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-white/8 transition-colors duration-200"
      >
        <div className="max-w-330 mx-auto px-4 sm:px-6 md:px-8 h-17.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4 items-center justify-center">
              <span className="w-1.5 h-1.5 bg-accent-lime group-hover:scale-110 transition-transform"></span>
              <span className="w-1.5 h-1.5 bg-current opacity-90"></span>
              <span className="w-1.5 h-1.5 bg-current opacity-35"></span>
              <span className="w-1.5 h-1.5 bg-current opacity-80"></span>
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

      {/* ============================================================ */}
      {/* 2. HERO SECTION — QUEUEWATCH/VERCEL SPLIT CONTROL SURFACE */}
      {/* ============================================================ */}
      <section
        id="hero-section"
        className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 md:px-8 max-w-330 mx-auto min-h-[calc(100vh-5rem)] flex flex-col justify-between relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-2 sm:pt-6">
          {/* LEFT COLUMN (~48%): OVERSIZED EDITORIAL HERO */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="hero-eyebrow flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent-lime"></span>
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

            {/* Vercel-like Action Buttons */}
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
                  <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse"></span>
                  <span>LIVE TRANSACTION</span>
                </div>
                <span className="text-subtle">RUNTIME // ACTIVE</span>
              </div>

              {/* 4-Stage Transaction Trace */}
              <div className="space-y-3">
                {/* Stage 01: Execute */}
                <div
                  onClick={() => setHeroTraceStage(0)}
                  className={`p-3.5 border transition-all cursor-pointer ${heroTraceStage === 0
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
                  className={`p-3.5 border transition-all cursor-pointer ${heroTraceStage === 1
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
                  className={`p-3.5 border transition-all cursor-pointer ${heroTraceStage === 2
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
                  className={`p-3.5 border transition-all cursor-pointer ${heroTraceStage === 3
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
            <div className="text-sm sm:text-sm font-semibold text-foreground">
              WebMCP-native
            </div>
            <div className="text-xs text-muted font-mono mt-0.5">
              Cross-origin execution
            </div>
          </div>

          <div className="hero-proof-cell px-4 py-3 sm:py-2">
            <div className="text-sm sm:text-sm font-semibold text-foreground">
              Durable state
            </div>
            <div className="text-xs text-muted font-mono mt-0.5">
              PostgreSQL-backed
            </div>
          </div>

          <div className="hero-proof-cell px-4 py-3 sm:py-2">
            <div className="text-sm sm:text-sm font-semibold text-foreground">
              Authoritative
            </div>
            <div className="text-xs text-muted font-mono mt-0.5">
              Reconciliation
            </div>
          </div>

          <div className="hero-proof-cell px-4 py-3 sm:py-2">
            <div className="text-sm sm:text-sm font-semibold text-foreground">
              Human-controlled
            </div>
            <div className="text-xs text-muted font-mono mt-0.5">
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
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
      >
        <div className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
              [ DISTRIBUTED UNCERTAINTY ]
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
              A timeout doesn’t tell you what happened.
            </h2>
            <p className="text-base sm:text-base text-muted leading-relaxed">
              A consequential write can commit successfully while its response disappears in transit. Retrying may duplicate the mutation. Assuming failure may corrupt state.
            </p>
          </div>

          {/* 3 Large Grid Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-white/9 divide-y md:divide-y-0 md:divide-x divide-white/9 bg-panel font-mono text-xs">
            {/* Column 01 */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="text-xs text-subtle">[ 01 ]</div>
              <div className="text-base font-bold text-foreground">WRITE SENT</div>
              <div className="p-3 border border-white/6 bg-background text-muted">
                create_route(spec) →
              </div>
              <p className="text-xs text-muted font-sans leading-relaxed">
                Mutation dispatched across origins to the state-owning service.
              </p>
            </div>

            {/* Column 02 */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="text-xs text-subtle">[ 02 ]</div>
              <div className="text-base font-bold text-amber-300">ACK LOST</div>
              <div className="p-3 border border-amber-500/30 bg-amber-950/20 text-amber-300 font-semibold">
                ? IN_DOUBT
              </div>
              <p className="text-xs text-muted font-sans leading-relaxed">
                Response packet dropped. Runtime halts blind retry to prevent duplicate creation.
              </p>
            </div>

            {/* Column 03 */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="text-xs text-subtle">[ 03 ]</div>
              <div className="text-base font-bold text-accent-lime">GROUND TRUTH</div>
              <div className="p-3 border border-accent-lime/30 bg-emerald-950/20 text-accent-lime font-semibold">
                get_route(opKey) → RECOVERED
              </div>
              <p className="text-xs text-muted font-sans leading-relaxed">
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
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
      >
        <div className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
              [ RELIABILITY PRIMITIVES ]
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
              Reliability primitives, not retry wrappers.
            </h2>
            <p className="text-base sm:text-base text-muted leading-relaxed">
              Every consequential WebMCP operation implements deterministic execution, inspection, and reverse compensation contracts.
            </p>
          </div>

          {/* 4 Capability Grid Cells */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/9 divide-y sm:divide-y-0 sm:divide-x divide-white/9 bg-panel font-mono text-xs">
            {/* Cell 01: Execute */}
            <div className="capability-cell p-6 sm:p-7 space-y-4">
              <div className="h-17.5 border-b border-white/6 flex items-center justify-between text-xs text-subtle">
                <span>[ 01 ]</span>
                <span className="text-foreground">EXECUTE</span>
              </div>
              <h3 className="text-base font-bold text-foreground">Operation Identity</h3>
              <p className="text-xs text-muted font-sans leading-relaxed">
                Bind consequential actions to a stable operation identity across origins.
              </p>
            </div>

            {/* Cell 02: Inspect */}
            <div className="capability-cell p-6 sm:p-7 space-y-4">
              <div className="h-17.5 border-b border-white/6 flex items-center justify-between text-xs text-subtle">
                <span>[ 02 ]</span>
                <span className="text-cyan-400">INSPECT</span>
              </div>
              <h3 className="text-base font-bold text-foreground">Authoritative Inspection</h3>
              <p className="text-xs text-muted font-sans leading-relaxed">
                Ask the application that owns the resource what actually exists.
              </p>
            </div>

            {/* Cell 03: Reconcile */}
            <div className="capability-cell p-6 sm:p-7 space-y-4">
              <div className="h-17.5 border-b border-white/6 flex items-center justify-between text-xs text-subtle">
                <span>[ 03 ]</span>
                <span className="text-accent-lime">RECONCILE</span>
              </div>
              <h3 className="text-base font-bold text-foreground">Uncertainty Recovery</h3>
              <p className="text-xs text-muted font-sans leading-relaxed">
                Resolve uncertain outcomes through authoritative inspection instead of blindly repeating the mutation.
              </p>
            </div>

            {/* Cell 04: Compensate */}
            <div className="capability-cell p-6 sm:p-7 space-y-4">
              <div className="h-17.5 border-b border-white/6 flex items-center justify-between text-xs text-subtle">
                <span>[ 04 ]</span>
                <span className="text-amber-400">COMPENSATE</span>
              </div>
              <h3 className="text-base font-bold text-foreground">Verified Compensation</h3>
              <p className="text-xs text-muted font-sans leading-relaxed">
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
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Large Copy */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
              [ COMPARISON // RUNTIME ]
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-[-0.04em] leading-[1.08]">
              Naive retry logic treats a timeout like failure.
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-[-0.03em] leading-[1.1]">
              MCPx treats <span className="text-accent-lime">uncertainty</span> as a state.
            </h3>
            <p className="text-sm sm:text-base text-muted leading-relaxed pt-1">
              Instead of guessing whether a consequential write succeeded, MCPx reconciles against authoritative service state before progressing or compensating.
            </p>
          </div>

          {/* Right Split Comparison */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 border border-white/9 divide-y sm:divide-y-0 sm:divide-x divide-white/9 bg-panel font-mono text-xs">
            {/* Left: Traditional Retry Logic */}
            <div className="p-6 space-y-4">
              <div className="text-xs text-subtle border-b border-white/6 pb-2">
                TRADITIONAL RETRY LOGIC
              </div>
              <div className="space-y-2 text-muted">
                <div>Request timeout</div>
                <div className="text-center text-subtle">↓</div>
                <div className="text-rose-400 font-semibold">FAILED (Assumed)</div>
                <div className="text-center text-subtle">↓</div>
                <div>Blind retry mutation</div>
              </div>
              <div className="pt-4 border-t border-white/6 text-rose-300 font-sans text-xs">
                Risk: Duplicate writes & orphaned resources.
              </div>
            </div>

            {/* Right: MCPx Runtime */}
            <div className="p-6 space-y-4 bg-[#0F1012]">
              <div className="text-xs text-accent-lime border-b border-white/6 pb-2">
                MCPX RELIABILITY RUNTIME
              </div>
              <div className="space-y-2">
                <div className="text-foreground">Request timeout</div>
                <div className="text-center text-subtle">↓</div>
                <div className="text-amber-400 font-semibold">IN_DOUBT (Uncertain)</div>
                <div className="text-center text-subtle">↓</div>
                <div className="text-cyan-300">Inspect authoritative state</div>
                <div className="text-center text-subtle">↓</div>
                <div className="text-accent-lime font-semibold">✓ RECOVERED</div>
              </div>
              <div className="pt-4 border-t border-white/6 text-accent-lime font-sans text-xs">
                Result: Resource confirmed without reissuing mutation.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. SECTION 5 — REFERENCE TRANSACTION (PINNED SCHEMATIC) */}
      {/* ============================================================ */}
      <div id="uncertainty-scrolly-section" className="border-t border-white/8 relative">
        <section
          id="reference-workflow"
          className="min-h-auto lg:min-h-screen py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto flex flex-col justify-center relative z-10"
        >
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
                  [ 04 · REFERENCE TOPOLOGY ]
                </span>
                <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
                  Watch a distributed transaction fail safely.
                </h2>
                <p className="text-sm sm:text-base text-muted leading-relaxed">
                  The included reference workflow runs across four independent WebMCP services to demonstrate cross-origin execution, reconciliation, and human-approved Saga rollback.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDagCompensating(!dagCompensating)}
                  className="px-3.5 py-1.5 rounded font-mono text-xs bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                >
                  {dagCompensating ? "Reset execution" : "Trigger Saga compensation"}
                </button>
                <Link
                  href="/app"
                  className="px-3.5 py-1.5 rounded font-mono text-xs bg-foreground text-background hover:bg-white transition-colors"
                >
                  Run in app
                </Link>
              </div>
            </div>

            {/* Blueprint DAG Schematic Canvas */}
            <div className="border border-white/9 bg-panel p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/6 pb-3 font-mono text-xs text-subtle">
                <span>TOPOLOGY // 4 SERVICES</span>
                <span>STATUS: {dagCompensating ? "COMPENSATED" : "ACTIVE"}</span>
              </div>

              {/* Node Layout */}
              <div className="space-y-4 max-w-lg mx-auto py-2 font-mono text-xs">
                {/* Node 1: Database */}
                <div className="dag-node-1 border border-white/8 bg-background p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-subtle block">[01] DATABASE</span>
                    <span className="text-foreground">create_database()</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs border ${dagCompensating ? "bg-white/4 text-subtle border-white/8" : "bg-emerald-950/60 text-accent-lime border-accent-lime/30"}`}>
                    {dagCompensating ? "COMPENSATED" : "✓ SUCCEEDED"}
                  </span>
                </div>

                <div className="flex justify-center">
                  <div className="h-5 w-px bg-white/10"></div>
                </div>

                {/* Node 2: Backend */}
                <div className="dag-node-2 border border-white/8 bg-background p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-subtle block">[02] BACKEND</span>
                    <span className="text-foreground">deploy_backend()</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs border ${dagCompensating ? "bg-white/4 text-subtle border-white/8" : "bg-emerald-950/60 text-accent-lime border-accent-lime/30"}`}>
                    {dagCompensating ? "COMPENSATED" : "✓ SUCCEEDED"}
                  </span>
                </div>

                <div className="flex justify-center items-center gap-28 sm:gap-40 py-1">
                  <span className="h-5 w-px bg-white/10 -rotate-25 transform origin-top"></span>
                  <span className="h-5 w-px bg-white/10 rotate-25 transform origin-top"></span>
                </div>

                {/* Nodes 3 & 4: Routing & Frontend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="dag-node-3 border border-amber-500/40 bg-background p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-subtle">[03] ROUTING</span>
                      <span className="text-xs text-accent-lime">RECOVERED</span>
                    </div>
                    <div className="text-foreground">create_route()</div>
                  </div>

                  <div className="dag-node-4 border border-rose-500/40 bg-background p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-subtle">[04] FRONTEND</span>
                      <span className="text-xs text-rose-400">FAILED</span>
                    </div>
                    <div className="text-foreground">deploy_frontend()</div>
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
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
      >
        <div className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
              [ SAFETY GATE ]
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
              Destructive rollback stays human-controlled.
            </h2>
            <p className="text-base text-muted leading-relaxed">
              When downstream steps fail, MCPx calculates safe reverse-order deletion and halts for human approval before removing live resources.
            </p>
          </div>

          {/* Operational Rollback State Panel */}
          <div className="border border-amber-500/40 bg-panel p-6 sm:p-8 font-mono text-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/6 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-amber-300 font-bold uppercase">ROLLBACK APPROVAL REQUIRED</span>
              </div>
              <span className="text-muted">FAILED STEP: [04] FRONTEND (NEVER COMMITTED)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-white/6 bg-background space-y-2">
                <span className="text-xs text-subtle uppercase block">
                  Resources currently present
                </span>
                <div className="space-y-1 text-foreground">
                  <div className="text-accent-lime">✓ Database (PostgreSQL schema active)</div>
                  <div className="text-accent-lime">✓ Backend (Compute runtime active)</div>
                  <div className="text-accent-lime">✓ Routing (Gateway route active)</div>
                  <div className="text-subtle pt-1">✕ Frontend (Never committed)</div>
                </div>
              </div>

              <div className="p-4 border border-white/6 bg-background space-y-2">
                <span className="text-xs text-subtle uppercase block">
                  Proposed rollback sequence
                </span>
                <div className="space-y-1 text-foreground">
                  <div>01 Routing gateway (delete_route)</div>
                  <div>02 Compute backend (delete_backend)</div>
                  <div>03 Database schema (CASCADE)</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/app"
                className="px-4 py-2 rounded bg-amber-400 hover:bg-amber-300 text-background font-bold text-xs transition-colors"
              >
                Approve rollback in app →
              </Link>
              <span className="text-subtle text-xs">
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
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 max-w-330 mx-auto border-t border-white/8 relative z-10"
      >
        <div className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono text-accent-lime uppercase tracking-wider">
              [ DEVELOPER PLATFORM ]
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-[-0.04em] leading-[1.05]">
              Bring your own WebMCP service.
            </h2>
            <p className="text-base text-muted leading-relaxed">
              Connect compatible applications, discover their tools, define reliability contracts, and compose them into multi-step workflows without modifying the MCPx runtime.
            </p>
          </div>

          {/* Connected Grid Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border border-white/9 divide-y sm:divide-y-0 sm:divide-x divide-white/9 bg-panel font-mono text-xs">
            <div className="p-5 space-y-2">
              <div className="text-xs text-subtle">[ 01 ]</div>
              <div className="font-bold text-foreground">CONNECT</div>
              <div className="text-xs text-muted">billing.example.com</div>
            </div>

            <div className="p-5 space-y-2">
              <div className="text-xs text-subtle">[ 02 ]</div>
              <div className="font-bold text-foreground">DISCOVER</div>
              <div className="text-xs text-accent-lime">6 tools found</div>
            </div>

            <div className="p-5 space-y-2">
              <div className="text-xs text-subtle">[ 03 ]</div>
              <div className="font-bold text-foreground">CONTRACT</div>
              <div className="text-xs text-muted">Execute / Inspect</div>
            </div>

            <div className="p-5 space-y-2">
              <div className="text-xs text-subtle">[ 04 ]</div>
              <div className="font-bold text-foreground">COMPOSE</div>
              <div className="text-xs text-muted">DAG Pipeline</div>
            </div>

            <div className="p-5 space-y-2 bg-[#0F1012]">
              <div className="text-xs text-accent-lime">[ 05 ]</div>
              <div className="font-bold text-accent-lime">RUN</div>
              <div className="text-xs text-foreground">Durable transaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. SECTION 8 — LIGHT CONTRAST SECTION ("Built around ground truth") */}
      {/* ============================================================ */}
      <section
        id="ground-truth"
        className="bg-[#F2F2EE] text-[#111210] py-20 sm:py-28 px-4 sm:px-6 md:px-8 border-y border-black/8 selection:bg-[#111210] selection:text-[#F2F2EE] transition-colors duration-200 relative z-10"
      >
        <div className="max-w-330 mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono text-[#4D7C0F] uppercase tracking-wider">
              [ GROUND TRUTH THESIS ]
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#111210] tracking-[-0.04em] leading-[1.05]">
              Built around ground truth.
            </h2>
            <p className="text-base text-[#4B5563] leading-relaxed">
              Consequential systems cannot rely on optimistic transport. The application that owns the resource is the sole authority on state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/8 border border-black/8 bg-[#F2F2EE]">
            <div className="p-8 space-y-3">
              <h3 className="text-xl font-bold text-[#111210]">Unknown is not failure.</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                When transport acknowledgements drop, operations enter authoritative inspection rather than being written off as errors.
              </p>
            </div>

            <div className="p-8 space-y-3">
              <h3 className="text-xl font-bold text-[#111210]">Durability before UI state.</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Every node transition, attempt, and inspection event is durably committed to PostgreSQL before downstream progression.
              </p>
            </div>

            <div className="p-8 space-y-3 border-t border-black/8">
              <h3 className="text-xl font-bold text-[#111210]">Compensation is verified.</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Saga rollbacks execute in strict reverse dependency order and inspect remote state to confirm deletion occurred.
              </p>
            </div>

            <div className="p-8 space-y-3 border-t border-black/8">
              <h3 className="text-xl font-bold text-[#111210]">The application owns the truth.</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">
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

      {/* ============================================================ */}
      {/* 11. FOOTER — VERCEL-CLEAN GRID ALIGNED */}
      {/* ============================================================ */}
      <footer className="border-t border-white/8 py-12 px-4 sm:px-6 md:px-8 max-w-330 mx-auto text-xs text-subtle font-mono relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/4">
          <div className="md:col-span-2 space-y-2 font-sans">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <span className="w-1.5 h-1.5 bg-accent-lime"></span>
                <span className="w-1.5 h-1.5 bg-white/80"></span>
                <span className="w-1.5 h-1.5 bg-white/40"></span>
                <span className="w-1.5 h-1.5 bg-white/80"></span>
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
    </div>
  );
}
