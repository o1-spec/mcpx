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
  const heroSculptureRef = useRef<SVGSVGElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Scrollytelling state (for UI reactivity and screen readers)
  const [scrollyStage, setScrollyStage] = useState<0 | 1 | 2 | 3>(0);
  const [dagCompensating, setDagCompensating] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReduced = mediaQuery.matches;
    setIsReducedMotion(prefersReduced);

    // Check sessionStorage for first visit
    const hasSeenIntro = sessionStorage.getItem("mcpx_intro_seen");
    const shouldPlayLoader = !hasSeenIntro && !prefersReduced;

    if (shouldPlayLoader) {
      setShowLoader(true);
      sessionStorage.setItem("mcpx_intro_seen", "true");
    }

    if (prefersReduced) {
      return; // Skip complex motion for accessibility
    }

    // 1. Initialize Lenis Smooth Scroll on desktop (native inertia on touch mobile)
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    let lenis: Lenis | null = null;

    if (!isTouchDevice && window.innerWidth >= 1024) {
      lenis = new Lenis({
        duration: 1.15,
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
            lenis.scrollTo(elem as HTMLElement, { offset: -70, duration: 1.2 });
          } else {
            elem.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    };
    document.addEventListener("click", handleAnchorClick);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // 2. Global Scroll Progress Bar
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

      // 3. Hero Layered Cinematic Entrance Timeline
      const heroTl = gsap.timeline({
        paused: shouldPlayLoader,
      });

      heroTl
        .fromTo(
          headerRef.current,
          { y: -16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85, ease: "power2.out" },
          0
        )
        .fromTo(
          ".hero-ambient-glow",
          { opacity: 0, scale: 0.9 },
          { opacity: 0.2, scale: 1, duration: 1.4, ease: "power2.out" },
          0
        )
        .fromTo(
          ".hero-sculpture-core",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.1, ease: "power3.out" },
          0.1
        )
        .fromTo(
          ".hero-telemetry-line",
          { opacity: 0, scaleY: 0, transformOrigin: "bottom center" },
          { opacity: 1, scaleY: 1, duration: 0.9, stagger: 0.08, ease: "power2.out" },
          0.3
        )
        .fromTo(
          ".hero-eyebrow",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
          0.4
        )
        .fromTo(
          ".hero-headline-line",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" },
          0.5
        )
        .fromTo(
          ".hero-supporting",
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
          0.7
        )
        .fromTo(
          ".hero-buttons",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
          0.8
        )
        .fromTo(
          ".hero-proof-item",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" },
          0.9
        );

      // 4. Initial Loader Sequence
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
            ".loader-core-base",
            { opacity: 0, scale: 0.85, y: 15 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out" },
            0.1
          )
          .fromTo(
            ".loader-tile-1",
            { opacity: 0, x: -20, y: -15 },
            { opacity: 1, x: 0, y: 0, duration: 0.4, ease: "power2.out" },
            0.3
          )
          .fromTo(
            ".loader-tile-2",
            { opacity: 0, x: 20, y: -15 },
            { opacity: 1, x: 0, y: 0, duration: 0.4, ease: "power2.out" },
            0.35
          )
          .fromTo(
            ".loader-tile-3",
            { opacity: 0, x: -20, y: 15 },
            { opacity: 1, x: 0, y: 0, duration: 0.4, ease: "power2.out" },
            0.4
          )
          .fromTo(
            ".loader-tile-4",
            { opacity: 0, x: 20, y: 15 },
            { opacity: 1, x: 0, y: 0, duration: 0.4, ease: "power2.out" },
            0.45
          )
          .fromTo(
            ".loader-lime-glow",
            { opacity: 0, scale: 0.6 },
            { opacity: 0.8, scale: 1.2, duration: 0.35, yoyo: true, repeat: 1, ease: "power2.out" },
            0.6
          )
          .fromTo(
            ".loader-telemetry",
            { opacity: 0, scaleY: 0, transformOrigin: "bottom center" },
            { opacity: 0.7, scaleY: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" },
            0.7
          )
          .fromTo(
            ".loader-wordmark",
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
            0.85
          )
          .to({}, { duration: 0.2 });
      }

      // ============================================================
      // 5. GSAP MATCHMEDIA: BLUEPRINT CHOREOGRAPHY
      // ============================================================

      mm.add("(min-width: 1024px)", () => {
        // Desktop Hero Parallax
        gsap.to(".hero-sculpture-core", {
          y: 45,
          ease: "none",
          scrollTrigger: {
            trigger: "#hero-section",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Desktop Pinned Uncertainty Scrollytelling
        ScrollTrigger.create({
          trigger: "#scrolly-uncertainty-container",
          start: "top top",
          end: "+=200%",
          pin: true,
          pinSpacing: true,
          snap: {
            snapTo: [0, 0.33, 0.66, 1],
            duration: { min: 0.2, max: 0.45 },
            delay: 0.05,
            ease: "power1.inOut",
          },
          onUpdate: (self) => {
            const progress = self.progress;
            if (progress < 0.22) {
              setScrollyStage(0);
            } else if (progress < 0.55) {
              setScrollyStage(1);
            } else if (progress < 0.82) {
              setScrollyStage(2);
            } else {
              setScrollyStage(3);
            }
          },
        });
      });

      mm.add("(max-width: 1023px)", () => {
        // Mobile Hero Parallax
        gsap.to(".hero-sculpture-core", {
          y: 20,
          ease: "none",
          scrollTrigger: {
            trigger: "#hero-section",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Mobile Vertical Pinned Scrollytelling
        ScrollTrigger.create({
          trigger: "#scrolly-uncertainty-container",
          start: "top 60px",
          end: "+=170%",
          pin: true,
          pinSpacing: true,
          snap: {
            snapTo: [0, 0.33, 0.66, 1],
            duration: { min: 0.15, max: 0.35 },
            delay: 0.08,
            ease: "power1.out",
          },
          onUpdate: (self) => {
            const progress = self.progress;
            if (progress < 0.22) {
              setScrollyStage(0);
            } else if (progress < 0.55) {
              setScrollyStage(1);
            } else if (progress < 0.82) {
              setScrollyStage(2);
            } else {
              setScrollyStage(3);
            }
          },
        });
      });

      // Section 1 Blueprint Cell Stagger
      gsap.fromTo(
        ".blueprint-cell-1, .blueprint-cell-2, .blueprint-cell-3",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: "#product", start: "top 80%" },
        }
      );

      // Section 4 Blueprint DAG Line Drawing
      const dagTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#reference-dag-section",
          start: "top 75%",
        },
      });

      dagTl
        .fromTo(
          ".dag-node-db",
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }
        )
        .fromTo(
          ".dag-line-1",
          { scaleY: 0, transformOrigin: "top center" },
          { scaleY: 1, duration: 0.35, ease: "none" }
        )
        .fromTo(
          ".dag-node-backend",
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }
        )
        .fromTo(
          ".dag-line-split",
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        )
        .fromTo(
          ".dag-node-routing, .dag-node-frontend",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.12, ease: "power2.out" }
        );

      // Dark-to-Light Navbar Color Adaptation on "Why MCPx"
      ScrollTrigger.create({
        trigger: "#why-mcpx",
        start: "top 80px",
        end: "bottom 80px",
        onEnter: () => {
          if (headerRef.current) {
            headerRef.current.classList.add(
              "bg-[#F2F2EE]/90",
              "text-[#111210]",
              "border-black/[0.08]"
            );
            headerRef.current.classList.remove("bg-[#080A0B]/85", "border-white/[0.06]");
          }
        },
        onLeave: () => {
          if (headerRef.current) {
            headerRef.current.classList.remove(
              "bg-[#F2F2EE]/90",
              "text-[#111210]",
              "border-black/[0.08]"
            );
            headerRef.current.classList.add("bg-[#080A0B]/85", "border-white/[0.06]");
          }
        },
        onEnterBack: () => {
          if (headerRef.current) {
            headerRef.current.classList.add(
              "bg-[#F2F2EE]/90",
              "text-[#111210]",
              "border-black/[0.08]"
            );
            headerRef.current.classList.remove("bg-[#080A0B]/85", "border-white/[0.06]");
          }
        },
        onLeaveBack: () => {
          if (headerRef.current) {
            headerRef.current.classList.remove(
              "bg-[#F2F2EE]/90",
              "text-[#111210]",
              "border-black/[0.08]"
            );
            headerRef.current.classList.add("bg-[#080A0B]/85", "border-white/[0.06]");
          }
        },
      });

      // Generic Product Horizontal/Vertical Flow (Section 6)
      gsap.fromTo(
        ".generic-flow-progress-bar",
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          ease: "power2.out",
          duration: 1.0,
          scrollTrigger: {
            trigger: "#generic-flow-section",
            start: "top 80%",
          },
        }
      );

      // Final CTA Text Mask Reveal
      gsap.fromTo(
        ".final-cta-line",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#final-cta-section",
            start: "top 80%",
          },
        }
      );
    }, mainRef);

    // Desktop Pointer Parallax on Hero Sculpture
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024 || prefersReduced || isTouchDevice) return;
      const xOffset = (e.clientX / window.innerWidth - 0.5) * 14;
      const yOffset = (e.clientY / window.innerHeight - 0.5) * 10;
      gsap.to(".hero-sculpture-core", {
        x: xOffset,
        y: yOffset,
        duration: 0.6,
        ease: "power1.out",
        overwrite: "auto",
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Keydown skip loader listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "Enter") && showLoader) {
        setShowLoader(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Debounced Resize handler to refresh ScrollTrigger
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
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleAnchorClick);
      if (lenis) {
        lenis.destroy();
      }
      ctx.revert();
    };
  }, [showLoader]);

  return (
    <div
      ref={mainRef}
      className="min-h-[100svh] bg-[#080A0B] text-[#F2F3F1] font-sans selection:bg-[#A5F36B] selection:text-[#080A0B] relative overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* Subtle Blueprint Grid Lines Background */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-40">
        <div className="w-full h-full max-w-[1240px] mx-auto border-x border-white/[0.04] grid grid-cols-3 md:grid-cols-6 divide-x divide-white/[0.03]" />
      </div>

      {/* ============================================================ */}
      {/* 0. SUBTLE 1.5PX SCROLL PROGRESS LINE */}
      {/* ============================================================ */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 right-0 h-[1.5px] bg-[#A5F36B] z-50 origin-left scale-x-0 pointer-events-none opacity-90"
      />

      {/* ============================================================ */}
      {/* INITIAL PAGE LOADER — MCPX TRANSACTION CORE BOOT */}
      {/* ============================================================ */}
      {showLoader && (
        <div
          ref={loaderRef}
          onClick={() => setShowLoader(false)}
          className="initial-loader-overlay fixed inset-0 z-[100] bg-[#080A0B] flex flex-col items-center justify-center select-none cursor-pointer p-4"
        >
          <div className="relative flex flex-col items-center justify-center space-y-4 sm:space-y-6">
            <svg
              className="w-[220px] sm:w-[280px] h-[160px] sm:h-[200px] pointer-events-none"
              viewBox="0 0 280 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="loaderMonolithTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1c1f26" />
                  <stop offset="60%" stopColor="#101217" />
                  <stop offset="100%" stopColor="#0a0c0f" />
                </linearGradient>
                <linearGradient id="loaderMonolithSide" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#12141a" />
                  <stop offset="100%" stopColor="#050608" />
                </linearGradient>
                <linearGradient id="loaderBeam" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#A5F36B" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#A5F36B" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#A5F36B" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="loaderGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#A5F36B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#080A0B" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Telemetry lines */}
              <line
                className="loader-telemetry"
                x1="134"
                y1="85"
                x2="134"
                y2="10"
                stroke="url(#loaderBeam)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <line
                className="loader-telemetry"
                x1="140"
                y1="80"
                x2="140"
                y2="5"
                stroke="url(#loaderBeam)"
                strokeWidth="1.5"
              />
              <line
                className="loader-telemetry"
                x1="146"
                y1="85"
                x2="146"
                y2="10"
                stroke="url(#loaderBeam)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />

              {/* Core Monolith Base */}
              <g className="loader-core-base" transform="translate(140, 110)">
                <circle className="loader-lime-glow" cx="0" cy="0" r="50" fill="url(#loaderGlow)" />

                {/* Top Facet */}
                <polygon
                  points="0,-36 64,0 0,36 -64,0"
                  fill="url(#loaderMonolithTop)"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                />
                {/* Left Side */}
                <polygon
                  points="-64,0 0,36 0,75 -64,42"
                  fill="url(#loaderMonolithSide)"
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="0.8"
                />
                {/* Right Side */}
                <polygon
                  points="0,36 64,0 64,42 0,75"
                  fill="#07080a"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="0.8"
                />

                {/* Inner Plate */}
                <polygon
                  points="0,-24 42,0 0,24 -42,0"
                  fill="#121418"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="0.8"
                />

                {/* 4 Assembly Hardware Tiles */}
                <rect
                  className="loader-tile-1"
                  x="-18"
                  y="-12"
                  width="13"
                  height="8"
                  rx="1.5"
                  fill="#A5F36B"
                  transform="rotate(-15)"
                />
                <rect
                  className="loader-tile-2"
                  x="5"
                  y="-12"
                  width="13"
                  height="8"
                  rx="1.5"
                  fill="#F2F3F1"
                  transform="rotate(15)"
                />
                <rect
                  className="loader-tile-3"
                  x="-18"
                  y="4"
                  width="13"
                  height="8"
                  rx="1.5"
                  fill="#3A3E48"
                  transform="rotate(-15)"
                />
                <rect
                  className="loader-tile-4"
                  x="5"
                  y="4"
                  width="13"
                  height="8"
                  rx="1.5"
                  fill="#E2E4DE"
                  transform="rotate(15)"
                />

                <circle cx="0" cy="0" r="1.5" fill="#080A0B" />
              </g>
            </svg>

            {/* Wordmark Reveal */}
            <div className="loader-wordmark flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A5F36B] animate-pulse"></span>
              <span className="font-display font-bold text-[16px] tracking-[-0.02em] text-[#F2F3F1]">
                MCPx
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. SLIM, QUIET BLUEPRINT NAVBAR */}
      {/* ============================================================ */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-[#080A0B]/85 backdrop-blur-md border-b border-white/[0.06] transition-colors duration-300"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            {/* Unboxed 4-tile geometric mark */}
            <div className="grid grid-cols-2 gap-1 w-4.5 h-4.5 items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#A5F36B] group-hover:scale-105 transition-transform"></span>
              <span className="w-1.5 h-1.5 bg-current opacity-90"></span>
              <span className="w-1.5 h-1.5 bg-current opacity-35"></span>
              <span className="w-1.5 h-1.5 bg-current opacity-80"></span>
            </div>
            <span className="font-display font-bold text-[17px] tracking-[-0.02em] text-current">
              MCPx
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 sm:gap-8 text-[13px] sm:text-[14px] font-normal opacity-80">
            <a
              href="#product"
              className="hover:opacity-100 transition-opacity duration-150"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="hover:opacity-100 transition-opacity duration-150"
            >
              How it works
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-100 transition-opacity duration-150"
            >
              GitHub
            </a>
            <Link
              href="/app"
              className="px-3.5 py-1.5 rounded-md bg-[#F2F3F1] text-[#080A0B] hover:bg-white font-medium text-[13px] transition-all duration-150 cursor-pointer shadow-sm ml-1"
            >
              Open app
            </Link>
          </nav>

          {/* Mobile Nav Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/app"
              className="px-3 py-1 rounded-md bg-[#F2F3F1] text-[#080A0B] font-medium text-[12px]"
            >
              App
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md bg-white/[0.05] border border-white/[0.1] text-[#F2F3F1] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0C0E0F]/95 backdrop-blur-xl border-b border-white/[0.08] px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-2 text-[14px]">
              <a
                href="#product"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded hover:bg-white/[0.05] text-[#F2F3F1]"
              >
                Product
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded hover:bg-white/[0.05] text-[#F2F3F1]"
              >
                How it works
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 rounded hover:bg-white/[0.05] text-[#F2F3F1]"
              >
                GitHub
              </a>
              <div className="pt-2">
                <Link
                  href="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-md bg-[#F2F3F1] text-[#080A0B] font-semibold text-center block text-[13px]"
                >
                  Open app
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION — ARCHITECTURAL PRODUCT SCULPTURE */}
      {/* ============================================================ */}
      <section
        id="hero-section"
        className="relative pt-16 sm:pt-20 pb-10 sm:pb-12 px-4 sm:px-6 md:px-8 max-w-[1240px] mx-auto flex flex-col items-center justify-between min-h-[calc(100svh-4rem)] z-10"
      >
        {/* Large Atmospheric Background Architectural Sculpture */}
        <div className="w-full relative flex justify-center items-center overflow-visible select-none pt-1 sm:pt-4">
          <div className="hero-ambient-glow absolute -top-16 left-1/2 -translate-x-[60%] w-[600px] sm:w-[800px] md:w-[1000px] h-[350px] sm:h-[450px] md:h-[550px] pointer-events-none mix-blend-screen overflow-hidden">
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_35%_20%,rgba(255,255,255,0.4)_0%,rgba(165,243,107,0.1)_25%,rgba(8,10,11,0)_70%)]" />
          </div>

          <svg
            ref={heroSculptureRef}
            className="w-full max-w-[840px] h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px] pointer-events-none relative z-0"
            viewBox="0 0 840 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="monolithTopElevated" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1c1f26" />
                <stop offset="60%" stopColor="#101217" />
                <stop offset="100%" stopColor="#0a0c0f" />
              </linearGradient>
              <linearGradient id="monolithSideElevated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12141a" />
                <stop offset="100%" stopColor="#050608" />
              </linearGradient>
              <linearGradient id="monolithSurface" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111317" />
                <stop offset="100%" stopColor="#060709" />
              </linearGradient>
              <linearGradient id="backgroundHex" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0d0f13" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#080A0B" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="telemetryBeam" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#A5F36B" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#A5F36B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#A5F36B" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="telemetryDim" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#F2F3F1" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#F2F3F1" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#F2F3F1" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#A5F36B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#080A0B" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Monoliths */}
            <path
              d="M 120 180 L 220 120 L 220 280 L 120 340 Z"
              fill="url(#backgroundHex)"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
            <path
              d="M 230 110 L 340 50 L 340 230 L 230 290 Z"
              fill="url(#monolithSurface)"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
            <path
              d="M 720 180 L 620 120 L 620 280 L 720 340 Z"
              fill="url(#backgroundHex)"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
            <path
              d="M 610 110 L 500 50 L 500 230 L 610 290 Z"
              fill="url(#monolithSurface)"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
            <path
              d="M 290 250 L 420 180 L 550 250 L 420 320 Z"
              fill="#080a0d"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />

            {/* Vertical Telemetry Beams */}
            <line
              className="hero-telemetry-line"
              x1="408"
              y1="100"
              x2="408"
              y2="0"
              stroke="url(#telemetryDim)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <line
              className="hero-telemetry-line"
              x1="414"
              y1="92"
              x2="414"
              y2="0"
              stroke="url(#telemetryBeam)"
              strokeWidth="1.2"
              strokeDasharray="4 2"
            />
            <line
              className="hero-telemetry-line"
              x1="420"
              y1="90"
              x2="420"
              y2="0"
              stroke="url(#telemetryBeam)"
              strokeWidth="1.5"
            />
            <line
              className="hero-telemetry-line"
              x1="426"
              y1="92"
              x2="426"
              y2="0"
              stroke="url(#telemetryBeam)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <line
              className="hero-telemetry-line"
              x1="432"
              y1="100"
              x2="432"
              y2="0"
              stroke="url(#telemetryDim)"
              strokeWidth="1"
              strokeDasharray="1 4"
            />

            {/* Central Elevated Core */}
            <g className="hero-sculpture-core" transform="translate(420, 115)">
              <circle cx="0" cy="0" r="70" fill="url(#coreGlow)" />
              <polygon
                points="0,-48 84,0 0,48 -84,0"
                fill="url(#monolithTopElevated)"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.2"
              />
              <polygon
                points="-84,0 0,48 0,110 -84,62"
                fill="url(#monolithSideElevated)"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
              />
              <polygon
                points="0,48 84,0 84,62 0,110"
                fill="#07080a"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
              <polygon
                points="0,-32 56,0 0,32 -56,0"
                fill="#121418"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="0.8"
              />

              <rect
                x="-22"
                y="-15"
                width="16"
                height="10"
                rx="1"
                fill="#A5F36B"
                transform="rotate(-15)"
              />
              <rect
                x="6"
                y="-15"
                width="16"
                height="10"
                rx="1"
                fill="#F2F3F1"
                transform="rotate(15)"
              />
              <rect
                x="-22"
                y="5"
                width="16"
                height="10"
                rx="1"
                fill="#3A3E48"
                transform="rotate(-15)"
              />
              <rect
                x="6"
                y="5"
                width="16"
                height="10"
                rx="1"
                fill="#E2E4DE"
                transform="rotate(15)"
              />
              <circle cx="0" cy="0" r="1.5" fill="#080A0B" />
            </g>
          </svg>
        </div>

        {/* Hero Copy & Call To Action */}
        <div className="text-center max-w-4xl mx-auto -mt-6 sm:-mt-12 md:-mt-16 lg:-mt-20 relative z-10 space-y-4 px-2">
          <div className="hero-eyebrow flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#A5F36B]"></span>
            <span className="text-[12px] sm:text-[13px] text-[#9B9FA1] font-mono tracking-normal uppercase">
              [ RELIABILITY RUNTIME FOR WEBMCP ]
            </span>
          </div>

          {/* Masked Line Reveal Headline */}
          <h1 className="font-display text-[30px] sm:text-[42px] md:text-[50px] lg:text-[56px] font-bold text-[#F2F3F1] tracking-[-0.035em] leading-[1.04] max-w-[740px] mx-auto overflow-hidden">
            <span className="block overflow-hidden py-1">
              <span className="hero-headline-line block">WebMCP, without the guesswork.</span>
            </span>
          </h1>

          <p className="hero-supporting text-[14px] sm:text-[16px] lg:text-[17px] text-[#9B9FA1] max-w-[480px] mx-auto leading-[1.5] font-normal">
            MCPx makes multi-step browser actions durable, recoverable, and safe to roll back.
          </p>

          <div className="hero-buttons flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full sm:w-auto">
            <Link
              href="/app"
              className="w-full sm:w-auto px-5 py-2.5 rounded-md text-[13px] sm:text-[14px] font-medium bg-[#F2F3F1] text-[#080A0B] hover:bg-white transition-all cursor-pointer shadow-sm text-center min-h-[44px] flex items-center justify-center font-mono"
            >
              Try the demo
            </Link>
            <a
              href="#product"
              className="w-full sm:w-auto px-5 py-2.5 rounded-md text-[13px] sm:text-[14px] font-medium text-[#F2F3F1] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center font-mono"
            >
              How it works
            </a>
          </div>
        </div>

        {/* Four Lightweight Proof Points (Blueprint strip) */}
        <div className="w-full max-w-[1240px] pt-10 sm:pt-14 md:pt-16 pb-2 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] border-t border-white/[0.06] relative z-10 mt-6 sm:mt-8">
          <div className="hero-proof-item px-4 py-3 sm:py-2">
            <div className="text-[13.5px] sm:text-[15px] font-semibold text-[#F2F3F1]">
              WebMCP native
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#9B9FA1] font-mono mt-0.5">
              Cross-origin execution
            </div>
          </div>

          <div className="hero-proof-item px-4 py-3 sm:py-2">
            <div className="text-[13.5px] sm:text-[15px] font-semibold text-[#F2F3F1]">
              Durable state
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#9B9FA1] font-mono mt-0.5">
              PostgreSQL backed
            </div>
          </div>

          <div className="hero-proof-item px-4 py-3 sm:py-2">
            <div className="text-[13.5px] sm:text-[15px] font-semibold text-[#F2F3F1]">
              Authoritative
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#9B9FA1] font-mono mt-0.5">
              Reconciliation
            </div>
          </div>

          <div className="hero-proof-item px-4 py-3 sm:py-2">
            <div className="text-[13.5px] sm:text-[15px] font-semibold text-[#F2F3F1]">
              Human controlled
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#9B9FA1] font-mono mt-0.5">
              Saga rollback
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SECTION 1: BLUEPRINT GRID CELLS ("What are you orchestrating?") */}
      {/* ============================================================ */}
      <section id="product" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-[1240px] mx-auto border-t border-white/[0.06] relative z-10">
        <div className="space-y-8 sm:space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-mono text-[#A5F36B] tracking-wider uppercase">
              [ 01 · ORCHESTRATION BLUEPRINT ]
            </span>
            <h2 className="font-display text-[24px] sm:text-[32px] md:text-[36px] font-bold text-[#F2F3F1] tracking-[-0.03em] leading-[1.1]">
              What are you orchestrating?
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#9B9FA1] leading-relaxed">
              Connect WebMCP applications, define how consequential actions recover, and compose them into durable multi-step workflows.
            </p>
          </div>

          {/* Connected 3-Column Blueprint Grid Frame */}
          <div className="border border-white/[0.08] divide-y md:divide-y-0 md:divide-x divide-white/[0.08] grid grid-cols-1 md:grid-cols-3 bg-[#080A0B]">
            {/* CELL 01: Connect services */}
            <div className="blueprint-cell-1 p-6 sm:p-7 flex flex-col justify-between space-y-6 relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#65696B]">
                  <span>[ 01 ]</span>
                  <span>DISCOVERY</span>
                </div>
                <h3 className="font-display text-[18px] sm:text-[20px] font-semibold text-[#F2F3F1]">
                  Connect services
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#9B9FA1] leading-relaxed">
                  Bring WebMCP-enabled applications into MCPx and discover the tools they expose across origin boundaries.
                </p>
              </div>

              {/* Technical Schematic: Origin + Discovered Tools */}
              <div className="border border-white/[0.06] bg-[#0C0E0F] p-4 font-mono text-[11px] space-y-3">
                <div className="flex items-center justify-between text-[10.5px] border-b border-white/[0.06] pb-2 text-[#9B9FA1]">
                  <span className="text-[#F2F3F1]">billing.example.com</span>
                  <span className="text-[#A5F36B]">6 tools</span>
                </div>

                <div className="space-y-1.5 text-[#9B9FA1] text-[10.5px]">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#A5F36B]"></span>
                    <span className="text-[#F2F3F1]">create_invoice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-white/40"></span>
                    <span>get_invoice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-white/40"></span>
                    <span>delete_invoice</span>
                  </div>
                </div>
              </div>

              <Link
                href="/app/services/new"
                className="inline-flex items-center text-[12.5px] font-mono text-[#A5F36B] hover:underline gap-1 pt-1"
              >
                Connect service →
              </Link>
            </div>

            {/* CELL 02: Define reliability */}
            <div className="blueprint-cell-2 p-6 sm:p-7 flex flex-col justify-between space-y-6 relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#65696B]">
                  <span>[ 02 ]</span>
                  <span>CONTRACTS</span>
                </div>
                <h3 className="font-display text-[18px] sm:text-[20px] font-semibold text-[#F2F3F1]">
                  Define reliability
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#9B9FA1] leading-relaxed">
                  Tell MCPx how a consequential operation should be executed, inspected, and safely compensated.
                </p>
              </div>

              {/* Technical Schematic: Contract Structure */}
              <div className="border border-white/[0.06] bg-[#0C0E0F] p-4 font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-[#65696B]">EXECUTE</span>
                  <span className="text-[#F2F3F1]">create_invoice</span>
                </div>
                <div className="text-center text-[#65696B] text-[10px]">↓</div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-[#65696B]">INSPECT</span>
                  <span className="text-[#A5F36B]">get_invoice</span>
                </div>
                <div className="text-center text-[#65696B] text-[10px]">↓</div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-[#65696B]">COMPENSATE</span>
                  <span className="text-[#F2F3F1]">delete_invoice</span>
                </div>
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#65696B]">
                  <span>IDENTITY</span>
                  <span className="text-[#9B9FA1]">operationKey</span>
                </div>
              </div>

              <Link
                href="/app/services"
                className="inline-flex items-center text-[12.5px] font-mono text-[#A5F36B] hover:underline gap-1 pt-1"
              >
                Define contracts →
              </Link>
            </div>

            {/* CELL 03: Compose workflows */}
            <div className="blueprint-cell-3 p-6 sm:p-7 flex flex-col justify-between space-y-6 relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#65696B]">
                  <span>[ 03 ]</span>
                  <span>EXECUTION</span>
                </div>
                <h3 className="font-display text-[18px] sm:text-[20px] font-semibold text-[#F2F3F1]">
                  Compose workflows
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#9B9FA1] leading-relaxed">
                  Combine reliable operations into dependency-aware transactions without hardcoding workflows into runtime.
                </p>
              </div>

              {/* Technical Schematic: Workflow Pipeline */}
              <div className="border border-white/[0.06] bg-[#0C0E0F] p-4 font-mono text-[11px] space-y-2">
                <div className="flex items-center gap-2 text-[#F2F3F1]">
                  <span className="w-1.5 h-1.5 bg-[#A5F36B]"></span>
                  <span>Create customer</span>
                </div>
                <div className="pl-2.5 text-[#65696B] text-[10px]">│</div>
                <div className="flex items-center gap-2 text-[#F2F3F1]">
                  <span className="w-1.5 h-1.5 bg-[#A5F36B]"></span>
                  <span>Create workspace</span>
                </div>
                <div className="pl-2.5 text-[#65696B] text-[10px]">│</div>
                <div className="flex items-center gap-2 text-[#9B9FA1]">
                  <span className="w-1.5 h-1.5 bg-white/40"></span>
                  <span>Send invite</span>
                </div>
              </div>

              <Link
                href="/app/workflows/new"
                className="inline-flex items-center text-[12.5px] font-mono text-[#A5F36B] hover:underline gap-1 pt-1"
              >
                Build workflows →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SECTION 2: BLUEPRINT UNCERTAINTY SCROLLYTELLING */}
      {/* "The response disappeared. Did the write happen?" */}
      {/* ============================================================ */}
      <div id="how-it-works" className="relative border-t border-white/[0.06]">
        <div
          id="scrolly-uncertainty-container"
          className="min-h-auto lg:min-h-screen py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-[1240px] mx-auto flex flex-col justify-center relative z-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Narrative */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">
              <span className="text-[11px] font-mono text-[#A5F36B] tracking-wider uppercase">
                [ 02 · UNCERTAINTY SCHEMATIC ]
              </span>
              <h2 className="font-display text-[24px] sm:text-[32px] md:text-[36px] font-bold text-[#F2F3F1] tracking-[-0.03em] leading-[1.1]">
                The response disappeared. Did the write happen?
              </h2>
              <p className="text-[14px] sm:text-[16px] text-[#9B9FA1] leading-relaxed">
                A lost response does not tell MCPx whether a consequential action actually committed. Instead of retrying blindly, MCPx asks the application that owns the state.
              </p>

              {/* Interactive Step Switcher */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[11px] text-[#65696B]">
                <button
                  onClick={() => setScrollyStage(0)}
                  className={`px-2.5 py-1 transition-colors cursor-pointer border ${scrollyStage === 0 ? "bg-white/10 text-[#F2F3F1] border-white/20" : "border-transparent hover:text-[#F2F3F1]"}`}
                >
                  [01] DISPATCH
                </button>
                <span>→</span>
                <button
                  onClick={() => setScrollyStage(1)}
                  className={`px-2.5 py-1 transition-colors cursor-pointer border ${scrollyStage === 1 ? "bg-amber-950/80 text-amber-300 border-amber-500/50" : "border-transparent hover:text-[#F2F3F1]"}`}
                >
                  [02] IN_DOUBT
                </button>
                <span>→</span>
                <button
                  onClick={() => setScrollyStage(2)}
                  className={`px-2.5 py-1 transition-colors cursor-pointer border ${scrollyStage === 2 ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50" : "border-transparent hover:text-[#F2F3F1]"}`}
                >
                  [03] INSPECT
                </button>
                <span>→</span>
                <button
                  onClick={() => setScrollyStage(3)}
                  className={`px-2.5 py-1 transition-colors cursor-pointer border ${scrollyStage === 3 ? "bg-emerald-950/80 text-[#A5F36B] border-[#A5F36B]/50" : "border-transparent hover:text-[#F2F3F1]"}`}
                >
                  [04] RECOVERED
                </button>
              </div>
            </div>

            {/* Right Column: Blueprint Integrated Schematic Grid */}
            <div className="lg:col-span-7">
              <div className="border border-white/[0.08] bg-[#0C0E0F] p-6 sm:p-8 space-y-6 relative">
                {/* Header state bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] font-mono text-[#65696B] uppercase">TARGET: routing.app</span>
                    <div className="font-mono text-[13px] text-[#F2F3F1]">create_route(spec)</div>
                  </div>

                  <div>
                    {scrollyStage === 0 && (
                      <span className="px-2.5 py-1 text-[11px] font-mono bg-white/[0.08] border border-white/20 text-[#F2F3F1]">
                        EXECUTING
                      </span>
                    )}
                    {scrollyStage === 1 && (
                      <span className="px-2.5 py-1 text-[11px] font-mono bg-amber-950/80 border border-amber-500/50 text-amber-300">
                        IN_DOUBT
                      </span>
                    )}
                    {scrollyStage === 2 && (
                      <span className="px-2.5 py-1 text-[11px] font-mono bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
                        RECONCILING
                      </span>
                    )}
                    {scrollyStage === 3 && (
                      <span className="px-2.5 py-1 text-[11px] font-mono bg-emerald-950/80 border border-[#A5F36B]/50 text-[#A5F36B]">
                        ✓ RECOVERED
                      </span>
                    )}
                  </div>
                </div>

                {/* Integrated Vertical Schematic Wire */}
                <div className="border border-white/[0.06] bg-[#080A0B] p-5 font-mono text-[11.5px] space-y-4">
                  <div className="flex items-center justify-between text-[11px] text-[#9B9FA1]">
                    <span>MCPx RUNTIME [CLIENT]</span>
                    <span className="text-[#65696B]">CROSS-ORIGIN</span>
                  </div>

                  <div className="flex flex-col items-center justify-center py-2 space-y-2 relative">
                    <div className="w-2 h-2 bg-[#F2F3F1]"></div>
                    <div className="w-[1px] h-16 bg-white/[0.1] relative overflow-hidden">
                      {scrollyStage === 0 && (
                        <div className="absolute inset-0 bg-[#F2F3F1] animate-pulse" />
                      )}
                      {scrollyStage === 1 && (
                        <div className="absolute top-1/2 left-0 w-full h-1/2 bg-amber-500 animate-pulse" />
                      )}
                      {scrollyStage === 2 && (
                        <div className="absolute inset-0 border-l border-dotted border-cyan-400" />
                      )}
                      {scrollyStage === 3 && (
                        <div className="absolute inset-0 bg-[#A5F36B]" />
                      )}
                    </div>
                    <div
                      className={`w-2 h-2 transition-colors ${
                        scrollyStage === 3
                          ? "bg-[#A5F36B]"
                          : scrollyStage === 1
                          ? "bg-amber-400"
                          : "bg-white/40"
                      }`}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#9B9FA1]">
                    <span>REMOTE APPLICATION [SERVICE]</span>
                    <span className="text-[#65696B]">STATE OWNER</span>
                  </div>

                  {/* Stage Narration Log */}
                  <div className="border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed">
                    {scrollyStage === 0 && (
                      <div className="text-[#9B9FA1]">
                        <span className="text-[#F2F3F1] font-semibold">[01] DISPATCHED: </span>
                        Mutation sent across origin. Awaiting network ACK packet.
                      </div>
                    )}
                    {scrollyStage === 1 && (
                      <div className="text-amber-300">
                        <span className="font-semibold text-amber-200">[02] ACK LOST: </span>
                        Response dropped. State is uncertain — mutation must NOT be blindly retried.
                      </div>
                    )}
                    {scrollyStage === 2 && (
                      <div className="text-cyan-300">
                        <span className="font-semibold text-cyan-200">[03] INSPECTION: </span>
                        Querying remote authoritative store: get_route(operationKey).
                      </div>
                    )}
                    {scrollyStage === 3 && (
                      <div className="text-[#A5F36B]">
                        <span className="font-semibold text-white">[04] CONFIRMED: </span>
                        Resource confirmed exists: true. Reconciled without duplicate mutation.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Blueprint Reliability Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-t border-white/[0.08] mt-12 pt-6">
            <div className="py-3 px-4 space-y-1.5">
              <span className="text-[10px] font-mono text-[#65696B]">[ 01 ]</span>
              <h3 className="font-display text-[15px] font-semibold text-[#F2F3F1]">
                Recover uncertainty
              </h3>
              <p className="text-[13px] text-[#9B9FA1] leading-relaxed">
                Inspect authoritative remote state instead of assuming a timed-out write failed.
              </p>
            </div>

            <div className="py-3 px-4 space-y-1.5">
              <span className="text-[10px] font-mono text-[#65696B]">[ 02 ]</span>
              <h3 className="font-display text-[15px] font-semibold text-[#F2F3F1]">
                Reverse compensation
              </h3>
              <p className="text-[13px] text-[#9B9FA1] leading-relaxed">
                Calculate compensation in reverse dependency order and verify every resource is gone.
              </p>
            </div>

            <div className="py-3 px-4 space-y-1.5">
              <span className="text-[10px] font-mono text-[#65696B]">[ 03 ]</span>
              <h3 className="font-display text-[15px] font-semibold text-[#F2F3F1]">
                Human approval
              </h3>
              <p className="text-[13px] text-[#9B9FA1] leading-relaxed">
                Pause before destructive compensation and show operators exactly what MCPx plans to remove.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. SECTION 4: BLUEPRINT REFERENCE DAG & SAGA ROLLBACK */}
      {/* ============================================================ */}
      <section
        id="reference-dag-section"
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-[1240px] mx-auto border-t border-white/[0.06] relative z-10"
      >
        <div className="space-y-8 sm:space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-mono text-[#A5F36B] tracking-wider uppercase">
              [ 03 · REFERENCE TOPOLOGY ]
            </span>
            <h2 className="font-display text-[24px] sm:text-[32px] md:text-[36px] font-bold text-[#F2F3F1] tracking-[-0.03em] leading-[1.1]">
              See the runtime under pressure.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#9B9FA1] leading-relaxed">
              The included deployment workflow uses four independent WebMCP applications to demonstrate cross-origin execution, uncertainty recovery, durable state, and reverse Saga compensation.
            </p>
          </div>

          {/* Blueprint Topology Frame */}
          <div className="border border-white/[0.08] bg-[#0C0E0F] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div className="space-y-0.5 font-mono text-[11px]">
                <span className="text-[#65696B]">SCENARIO:</span>
                <span className="text-[#F2F3F1] ml-2">4-SERVICE DEPLOYMENT WORKFLOW</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setDagCompensating(!dagCompensating)}
                  className="px-3 py-1.5 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 font-mono text-[12px] transition-colors cursor-pointer"
                >
                  {dagCompensating ? "Reset execution" : "Trigger Saga compensation"}
                </button>
                <Link
                  href="/app"
                  className="px-3 py-1.5 rounded bg-[#F2F3F1] text-[#080A0B] hover:bg-white font-mono text-[12px] transition-colors"
                >
                  Run live in app
                </Link>
              </div>
            </div>

            {/* Direct Grid DAG Schematic (No large cards) */}
            <div className="space-y-4 max-w-xl mx-auto py-2">
              {/* Layer 1: Database */}
              <div className="flex justify-center">
                <div className="dag-node-db w-full max-w-sm border border-white/[0.08] bg-[#080A0B] p-3 flex items-center justify-between font-mono text-[11.5px]">
                  <div>
                    <span className="text-[10px] text-[#65696B] block">[01] DATABASE</span>
                    <span className="text-[#F2F3F1]">create_database()</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] border ${
                      dagCompensating
                        ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                        : "bg-emerald-950/60 text-[#A5F36B] border-[#A5F36B]/30"
                    }`}
                  >
                    {dagCompensating ? "COMPENSATED" : "✓ COMMITTED"}
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="dag-line-1 h-5 w-[1px] bg-white/[0.1]"></div>
              </div>

              {/* Layer 2: Backend */}
              <div className="flex justify-center">
                <div className="dag-node-backend w-full max-w-sm border border-white/[0.08] bg-[#080A0B] p-3 flex items-center justify-between font-mono text-[11.5px]">
                  <div>
                    <span className="text-[10px] text-[#65696B] block">[02] BACKEND</span>
                    <span className="text-[#F2F3F1]">deploy_backend()</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] border ${
                      dagCompensating
                        ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                        : "bg-emerald-950/60 text-[#A5F36B] border-[#A5F36B]/30"
                    }`}
                  >
                    {dagCompensating ? "COMPENSATED" : "✓ BOUND"}
                  </span>
                </div>
              </div>

              <div className="dag-line-split flex justify-center items-center gap-24 sm:gap-36">
                <span className="h-5 w-[1px] bg-white/[0.1] -rotate-25 transform origin-top"></span>
                <span className="h-5 w-[1px] bg-white/[0.1] rotate-25 transform origin-top"></span>
              </div>

              {/* Layer 3: Routing & Frontend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="dag-node-routing border border-amber-500/40 bg-[#080A0B] p-3 space-y-1 font-mono text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#65696B]">[03] ROUTING</span>
                    <span className="text-[9.5px] text-[#A5F36B]">RECOVERED</span>
                  </div>
                  <div className="text-[#F2F3F1]">create_route()</div>
                </div>

                <div className="dag-node-frontend border border-rose-500/40 bg-[#080A0B] p-3 space-y-1 font-mono text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#65696B]">[04] FRONTEND</span>
                    <span className="text-[9.5px] text-rose-400">FAILED</span>
                  </div>
                  <div className="text-[#F2F3F1]">deploy_frontend()</div>
                </div>
              </div>

              {/* Blueprint Human Approval State Panel */}
              <div className="border border-white/[0.08] bg-[#080A0B] p-4 text-[11.5px] font-mono space-y-2">
                <div className="flex items-center justify-between text-[#9B9FA1] border-b border-white/[0.06] pb-2">
                  <span className="text-amber-400">HUMAN INTERVENTION REQUIRED</span>
                  <span>ROLLBACK: 03 ← 02 ← 01</span>
                </div>
                <div className="flex items-center justify-between text-[#65696B] text-[10.5px]">
                  <span>Existing: Routing · Backend · Database</span>
                  <span className="text-[#A5F36B]">
                    {dagCompensating ? "ROLLBACK COMPLETED" : "AWAITING CONFIRMATION"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. SECTION 5: LIGHT EDITORIAL BLUEPRINT ("Why MCPx") */}
      {/* ============================================================ */}
      <section
        id="why-mcpx"
        className="bg-[#F2F2EE] text-[#111210] py-16 sm:py-24 md:py-28 px-4 sm:px-6 md:px-8 border-y border-black/[0.08] selection:bg-[#111210] selection:text-[#F2F2EE] transition-colors duration-300 relative z-10"
      >
        <div className="max-w-[1240px] mx-auto space-y-10 sm:space-y-14">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-mono text-[#4D7C0F] tracking-wider uppercase">
              [ 04 · ARCHITECTURAL THESIS ]
            </span>
            <h2 className="font-display text-[26px] sm:text-[34px] md:text-[40px] font-bold text-[#111210] tracking-[-0.03em] leading-[1.1]">
              Reliability is a runtime concern.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#4B5563] leading-relaxed">
              Consequential browser workflows need more than successful API calls. MCPx keeps operation identity, authoritative state, transaction history, and human control in one runtime.
            </p>
          </div>

          {/* Asymmetrical Editorial Grid (No rounded cards) */}
          <div className="border border-black/[0.08] divide-y divide-black/[0.08] bg-[#F2F2EE]">
            {/* Row 1: Dual Concepts */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/[0.08]">
              {/* Left: Unknown is not failure */}
              <div className="p-6 sm:p-8 space-y-4">
                <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-[#111210]">
                  Unknown is not failure.
                </h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">
                  When transport acks drop, operations enter authoritative inspection rather than being written off as errors.
                </p>
                <div className="pt-2 font-mono text-[11px] text-[#4B5563] space-y-1">
                  <div className="font-semibold text-[#111210]">EXECUTING</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div className="text-[#D97706] font-semibold">IN_DOUBT</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div className="font-semibold text-[#111210]">INSPECT</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div className="text-[#15803D] font-semibold">RECOVERED</div>
                </div>
              </div>

              {/* Right: Durable execution */}
              <div className="p-6 sm:p-8 space-y-4">
                <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-[#111210]">
                  Durable execution
                </h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">
                  Every node transition, attempt, and inspection event is durably committed to PostgreSQL before downstream progression.
                </p>
                <div className="pt-2 font-mono text-[11px] text-[#4B5563] space-y-1">
                  <div className="font-semibold text-[#111210]">Transaction #18</div>
                  <div className="text-[#6B7280]">Event #01 · DISPATCHED</div>
                  <div className="text-[#6B7280]">Event #02 · IN_DOUBT</div>
                  <div className="text-[#6B7280]">Event #03 · RECONCILING</div>
                  <div className="text-[#15803D] font-semibold pt-1">✓ PostgreSQL persisted</div>
                </div>
              </div>
            </div>

            {/* Row 2: Dual Concepts */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/[0.08]">
              {/* Left: Human-controlled rollback */}
              <div className="p-6 sm:p-8 space-y-4">
                <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-[#111210]">
                  Human-controlled rollback
                </h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">
                  Destructive Saga compensations require human verification before executing resource deletions across origins.
                </p>
                <div className="pt-2 font-mono text-[11px] text-[#4B5563] space-y-1">
                  <div className="text-[10px] text-[#6B7280]">3 resources exist:</div>
                  <div className="font-medium text-[#111210]">Routing · Backend · Database</div>
                  <div className="text-[#D97706] font-semibold pt-1">⏸ Approve rollback required</div>
                </div>
              </div>

              {/* Right: Crash recovery */}
              <div className="p-6 sm:p-8 space-y-4">
                <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-[#111210]">
                  Crash recovery
                </h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">
                  Browser refresh or process termination resumes smoothly from durable state without lost transaction context.
                </p>
                <div className="pt-2 font-mono text-[11px] text-[#4B5563] space-y-1">
                  <div>Browser refreshed</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div>Transaction restored from store</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div className="text-[#15803D] font-semibold">Reconciliation resumed</div>
                </div>
              </div>
            </div>

            {/* Row 3: Full Width Bring Your Own Service Block */}
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[11.5px] text-[#4B5563]">
              <div>
                <span className="text-[#111210] font-semibold">Bring your own WebMCP service</span>
                <span className="text-[#6B7280] ml-2">· Connect compatible services without changing the runtime.</span>
              </div>
              <div className="text-[#15803D] font-semibold">
                billing.example.com → 6 tools → READY
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. SECTION 6: BLUEPRINT PRODUCT FLOW ("Your services. Your workflows.") */}
      {/* ============================================================ */}
      <section
        id="generic-flow-section"
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-[1240px] mx-auto border-b border-white/[0.06] relative z-10"
      >
        <div className="space-y-8 sm:space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-mono text-[#A5F36B] tracking-wider uppercase">
              [ 05 · GENERIC RUNTIME PIPELINE ]
            </span>
            <h2 className="font-display text-[24px] sm:text-[32px] md:text-[36px] font-bold text-[#F2F3F1] tracking-[-0.03em] leading-[1.1]">
              Your services. Your workflows.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#9B9FA1] leading-relaxed">
              The included deployment is only a reference workflow. Connect compatible WebMCP services without changing the MCPx runtime.
            </p>
          </div>

          {/* Connected Blueprint Transformation Schematic */}
          <div className="border border-white/[0.08] bg-[#0C0E0F] p-6 sm:p-8 space-y-8 relative">
            <div className="generic-flow-progress-bar absolute top-0 left-0 right-0 h-[1.5px] bg-[#A5F36B] origin-left scale-x-0" />

            {/* Horizontal Flow Blueprint */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11.5px] font-mono pb-6 border-b border-white/[0.06] text-[#9B9FA1]">
              <span className="text-[#F2F3F1]">CONNECT SERVICE</span>
              <span className="text-[#65696B]">───►</span>
              <span className="text-[#F2F3F1]">DISCOVER TOOLS</span>
              <span className="text-[#65696B]">───►</span>
              <span className="text-[#F2F3F1]">DEFINE CONTRACT</span>
              <span className="text-[#65696B]">───►</span>
              <span className="text-[#F2F3F1]">CREATE WORKFLOW</span>
              <span className="text-[#65696B]">───►</span>
              <span className="text-[#A5F36B] font-semibold">RUN RELIABLY</span>
            </div>

            {/* Realistic Transformation Schematic */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] border border-white/[0.06] bg-[#080A0B] font-mono text-[11.5px]">
              <div className="p-5 space-y-2">
                <div className="text-[#65696B] text-[10px]">[ STATE 01 ]</div>
                <div className="text-[#F2F3F1] font-semibold text-[13px]">Widget Factory Service</div>
                <div className="text-[#A5F36B] text-[11px]">9 tools discovered</div>
                <div className="text-[#65696B] text-[10.5px] space-y-0.5 pt-1">
                  <div>create_widget</div>
                  <div>get_widget</div>
                  <div>delete_widget</div>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <div className="text-[#65696B] text-[10px]">[ STATE 02 ]</div>
                <div className="text-[#F2F3F1] font-semibold text-[13px]">Reliability Contract</div>
                <div className="text-[#A5F36B] text-[11px]">READY</div>
                <div className="text-[#65696B] text-[10.5px] space-y-0.5 pt-1">
                  <div>Execute: create_widget</div>
                  <div>Inspect: get_widget</div>
                  <div>Compensate: delete_widget</div>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <div className="text-[#65696B] text-[10px]">[ STATE 03 ]</div>
                <div className="text-[#F2F3F1] font-semibold text-[13px]">Workflow Pipeline</div>
                <div className="text-[#A5F36B] text-[11px]">READY TO RUN</div>
                <div className="text-[#65696B] text-[10.5px] space-y-0.5 pt-1">
                  <div>Create Widget → Publish Catalog</div>
                  <div className="text-[#9B9FA1]">Deterministic operationKey bound</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. SECTION 7: FINAL CALL TO ACTION (Faded grid rest) */}
      {/* ============================================================ */}
      <section
        id="final-cta-section"
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-center space-y-6 relative z-10"
      >
        <h2 className="font-display text-[26px] sm:text-[34px] md:text-[38px] font-bold text-[#F2F3F1] tracking-[-0.03em] leading-[1.08] overflow-hidden">
          <span className="block overflow-hidden py-1">
            <span className="final-cta-line block">Build workflows that know what happened.</span>
          </span>
        </h2>
        <p className="text-[14px] sm:text-[16px] text-[#9B9FA1] max-w-[480px] mx-auto leading-relaxed">
          Connect WebMCP services and run consequential actions with durable execution, authoritative reconciliation, and controlled rollback.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full sm:w-auto">
          <Link
            href="/app"
            className="w-full sm:w-auto px-5 py-2.5 rounded-md text-[13px] sm:text-[14px] font-medium bg-[#F2F3F1] text-[#080A0B] hover:bg-white transition-all cursor-pointer shadow-sm text-center min-h-[44px] flex items-center justify-center font-mono"
          >
            Open MCPx
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-md text-[13px] sm:text-[14px] font-medium text-[#F2F3F1] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center font-mono"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. STRUCTURED BLUEPRINT FOOTER */}
      {/* ============================================================ */}
      <footer className="border-t border-white/[0.06] py-10 sm:py-12 px-4 sm:px-6 md:px-8 max-w-[1240px] mx-auto text-xs text-[#65696B] relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 sm:pb-10 border-b border-white/[0.04]">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <span className="w-1.5 h-1.5 bg-[#A5F36B]"></span>
                <span className="w-1.5 h-1.5 bg-white/80"></span>
                <span className="w-1.5 h-1.5 bg-white/40"></span>
                <span className="w-1.5 h-1.5 bg-white/80"></span>
              </div>
              <span className="text-[#F2F3F1] font-semibold text-[15px]">MCPx</span>
            </div>
            <p className="text-[13px] text-[#9B9FA1] max-w-sm leading-relaxed">
              Reliability runtime for WebMCP workflows. Durable transaction execution, authoritative reconciliation, and human-gated rollback.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-mono text-[#F2F3F1] uppercase tracking-wider">[ NAVIGATION ]</div>
            <div className="space-y-1.5 text-[13px] text-[#9B9FA1] flex flex-col font-mono">
              <a href="#product" className="hover:text-[#F2F3F1] transition-colors py-1">Product</a>
              <a href="#how-it-works" className="hover:text-[#F2F3F1] transition-colors py-1">How it works</a>
              <Link href="/app" className="hover:text-[#F2F3F1] transition-colors py-1">Open app</Link>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-mono text-[#F2F3F1] uppercase tracking-wider">[ RESOURCES ]</div>
            <div className="space-y-1.5 text-[13px] text-[#9B9FA1] flex flex-col font-mono">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#F2F3F1] transition-colors py-1">GitHub Repository</a>
              <Link href="/app/services/new" className="hover:text-[#F2F3F1] transition-colors py-1">Connect Service</Link>
              <Link href="/app/workflows/new" className="hover:text-[#F2F3F1] transition-colors py-1">Workflow Builder</Link>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono text-[#65696B]">
          <span>APACHE-2.0 OPEN SOURCE</span>
          <span>WEBMCP RELIABILITY RUNTIME ARCHITECTURE</span>
        </div>
      </footer>
    </div>
  );
}
