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
        paused: shouldPlayLoader, // Triggered after loader handoff
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

      // 4. Initial Loader Sequence (Desktop & Mobile)
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
      // 5. GSAP MATCHMEDIA: DESKTOP VS MOBILE MOTION CHOREOGRAPHY
      // ============================================================

      // DESKTOP CHOREOGRAPHY (>= 1024px)
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

        // Desktop Pinned Scrollytelling (Section 2)
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

      // MOBILE & TABLET CHOREOGRAPHY (< 1024px)
      mm.add("(max-width: 1023px)", () => {
        // Mobile Hero Subtle Parallax
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

        // Mobile Vertical Pinned Scrollytelling (170vh duration, gentle touch snap)
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

      // Product Paths Lateral Stagger (Section 1)
      gsap.fromTo(
        ".product-card-1",
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: "#product", start: "top 80%" },
        }
      );
      gsap.fromTo(
        ".product-card-2",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: "#product", start: "top 80%" },
        }
      );
      gsap.fromTo(
        ".product-card-3",
        { x: 20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: "#product", start: "top 80%" },
        }
      );

      // Reference DAG Scroll Animation (Section 4)
      const dagTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#reference-dag-section",
          start: "top 75%",
        },
      });

      dagTl
        .fromTo(
          ".dag-node-db",
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: "power2.out" }
        )
        .fromTo(
          ".dag-line-1",
          { scaleY: 0, transformOrigin: "top center" },
          { scaleY: 1, duration: 0.35, ease: "none" }
        )
        .fromTo(
          ".dag-node-backend",
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: "power2.out" }
        )
        .fromTo(
          ".dag-line-split",
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        )
        .fromTo(
          ".dag-node-routing, .dag-node-frontend",
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.12, ease: "power2.out" }
        )
        .fromTo(
          ".dag-approval-banner",
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
          "+=0.1"
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
            headerRef.current.classList.remove("bg-[#050607]/80", "border-white/[0.06]");
          }
        },
        onLeave: () => {
          if (headerRef.current) {
            headerRef.current.classList.remove(
              "bg-[#F2F2EE]/90",
              "text-[#111210]",
              "border-black/[0.08]"
            );
            headerRef.current.classList.add("bg-[#050607]/80", "border-white/[0.06]");
          }
        },
        onEnterBack: () => {
          if (headerRef.current) {
            headerRef.current.classList.add(
              "bg-[#F2F2EE]/90",
              "text-[#111210]",
              "border-black/[0.08]"
            );
            headerRef.current.classList.remove("bg-[#050607]/80", "border-white/[0.06]");
          }
        },
        onLeaveBack: () => {
          if (headerRef.current) {
            headerRef.current.classList.remove(
              "bg-[#F2F2EE]/90",
              "text-[#111210]",
              "border-black/[0.08]"
            );
            headerRef.current.classList.add("bg-[#050607]/80", "border-white/[0.06]");
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
      className="min-h-[100svh] bg-[#050607] text-[#F4F4F2] font-sans selection:bg-[#A6F275] selection:text-[#050607] relative overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* ============================================================ */}
      {/* 0. SUBTLE 1.5PX SCROLL PROGRESS LINE */}
      {/* ============================================================ */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 right-0 h-[1.5px] bg-[#A6F275] z-50 origin-left scale-x-0 pointer-events-none opacity-85"
      />

      {/* ============================================================ */}
      {/* INITIAL PAGE LOADER — MCPX TRANSACTION CORE BOOT */}
      {/* ============================================================ */}
      {showLoader && (
        <div
          ref={loaderRef}
          onClick={() => setShowLoader(false)}
          className="initial-loader-overlay fixed inset-0 z-[100] bg-[#050607] flex flex-col items-center justify-center select-none cursor-pointer p-4"
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
                  <stop offset="0%" stopColor="#A6F275" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#A6F275" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#A6F275" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="loaderGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#A6F275" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#050607" stopOpacity="0" />
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
                  fill="#A6F275"
                  transform="rotate(-15)"
                />
                <rect
                  className="loader-tile-2"
                  x="5"
                  y="-12"
                  width="13"
                  height="8"
                  rx="1.5"
                  fill="#F4F4F2"
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

                <circle cx="0" cy="0" r="1.5" fill="#050607" />
              </g>
            </svg>

            {/* Wordmark Reveal */}
            <div className="loader-wordmark flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275] animate-pulse"></span>
              <span className="font-display font-bold text-[16px] tracking-[-0.02em] text-[#F4F4F2]">
                MCPx
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. SLIM, QUIET STICKY NAVBAR */}
      {/* ============================================================ */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-[#050607]/80 backdrop-blur-md border-b border-white/[0.06] transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            {/* Unboxed 4-tile geometric mark */}
            <div className="grid grid-cols-2 gap-1 w-4.5 h-4.5 items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-[#A6F275] group-hover:scale-105 transition-transform"></span>
              <span className="w-1.5 h-1.5 rounded-[1px] bg-current opacity-90"></span>
              <span className="w-1.5 h-1.5 rounded-[1px] bg-current opacity-35"></span>
              <span className="w-1.5 h-1.5 rounded-[1px] bg-current opacity-80"></span>
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
              className="px-3.5 py-1.5 rounded-lg bg-[#F4F4F2] text-[#050607] hover:bg-white font-medium text-[13px] transition-all duration-150 cursor-pointer shadow-sm ml-1"
            >
              Open app
            </Link>
          </nav>

          {/* Mobile Nav Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/app"
              className="px-3 py-1 rounded-lg bg-[#F4F4F2] text-[#050607] font-medium text-[12px]"
            >
              App
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.1] text-[#F4F4F2] cursor-pointer"
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
          <div className="md:hidden bg-[#0C0D0E]/95 backdrop-blur-xl border-b border-white/[0.08] px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-2 text-[14px]">
              <a
                href="#product"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-white/[0.05] text-[#F4F4F2]"
              >
                Product
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-white/[0.05] text-[#F4F4F2]"
              >
                How it works
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 rounded-lg hover:bg-white/[0.05] text-[#F4F4F2]"
              >
                GitHub
              </a>
              <div className="pt-2">
                <Link
                  href="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F4F4F2] text-[#050607] font-semibold text-center block text-[13px]"
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
        className="relative pt-16 sm:pt-20 pb-10 sm:pb-12 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto flex flex-col items-center justify-between min-h-[calc(100svh-4rem)]"
      >
        {/* Large Atmospheric Background Architectural Sculpture */}
        <div className="w-full relative flex justify-center items-center overflow-visible select-none pt-1 sm:pt-4">
          {/* Volumetric ambient light ray from top-left */}
          <div className="hero-ambient-glow absolute -top-16 left-1/2 -translate-x-[60%] w-[600px] sm:w-[800px] md:w-[1000px] h-[350px] sm:h-[450px] md:h-[550px] pointer-events-none mix-blend-screen overflow-hidden">
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_35%_20%,rgba(255,255,255,0.4)_0%,rgba(166,242,117,0.1)_25%,rgba(5,6,7,0)_70%)]" />
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
                <stop offset="100%" stopColor="#050607" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="telemetryBeam" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#A6F275" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#A6F275" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#A6F275" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="telemetryDim" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#F4F4F2" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#F4F4F2" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#F4F4F2" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#A6F275" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#050607" stopOpacity="0" />
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
                rx="2"
                fill="#A6F275"
                transform="rotate(-15)"
              />
              <rect
                x="6"
                y="-15"
                width="16"
                height="10"
                rx="2"
                fill="#F4F4F2"
                transform="rotate(15)"
              />
              <rect
                x="-22"
                y="5"
                width="16"
                height="10"
                rx="2"
                fill="#3A3E48"
                transform="rotate(-15)"
              />
              <rect
                x="6"
                y="5"
                width="16"
                height="10"
                rx="2"
                fill="#E2E4DE"
                transform="rotate(15)"
              />
              <circle cx="0" cy="0" r="1.5" fill="#050607" />
            </g>
          </svg>
        </div>

        {/* Hero Copy & Call To Action */}
        <div className="text-center max-w-4xl mx-auto -mt-6 sm:-mt-12 md:-mt-16 lg:-mt-20 relative z-10 space-y-4 px-2">
          <div className="hero-eyebrow flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275]"></span>
            <span className="text-[12px] sm:text-[13px] text-[#A0A3A8] font-normal tracking-normal">
              Reliability infrastructure for WebMCP
            </span>
          </div>

          {/* Masked Line Reveal Headline */}
          <h1 className="font-display text-[30px] sm:text-[42px] md:text-[50px] lg:text-[56px] font-bold text-[#F4F4F2] tracking-[-0.035em] leading-[1.04] max-w-[740px] mx-auto overflow-hidden">
            <span className="block overflow-hidden py-1">
              <span className="hero-headline-line block">WebMCP, without the guesswork.</span>
            </span>
          </h1>

          <p className="hero-supporting text-[14px] sm:text-[16px] lg:text-[17px] text-[#A0A3A8] max-w-[480px] mx-auto leading-[1.5] font-normal">
            MCPx makes multi-step browser actions durable, recoverable, and safe to roll back.
          </p>

          <div className="hero-buttons flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full sm:w-auto">
            <Link
              href="/app"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-medium bg-[#F4F4F2] text-[#050607] hover:bg-white transition-all cursor-pointer shadow-sm text-center min-h-[44px] flex items-center justify-center"
            >
              Try the demo
            </Link>
            <a
              href="#product"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#F4F4F2] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center"
            >
              How it works
            </a>
          </div>
        </div>

        {/* Four Lightweight Proof Points */}
        <div className="w-full max-w-4xl pt-10 sm:pt-14 md:pt-16 pb-2 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-left border-t border-white/[0.06] relative z-10 mt-6 sm:mt-8">
          <div className="hero-proof-item">
            <div className="text-[13.5px] sm:text-[15px] font-semibold text-[#F4F4F2]">
              WebMCP native
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#A0A3A8] mt-0.5">
              Cross-origin execution
            </div>
          </div>

          <div className="hero-proof-item">
            <div className="text-[13.5px] sm:text-[15px] font-semibold text-[#F4F4F2]">
              Durable state
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#A0A3A8] mt-0.5">
              PostgreSQL backed
            </div>
          </div>

          <div className="hero-proof-item">
            <div className="text-[13.5px] sm:text-[15px] font-semibold text-[#F4F4F2]">
              Authoritative
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#A0A3A8] mt-0.5">
              Reconciliation
            </div>
          </div>

          <div className="hero-proof-item">
            <div className="text-[13.5px] sm:text-[15px] font-semibold text-[#F4F4F2]">
              Human controlled
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#A0A3A8] mt-0.5">
              Saga rollback
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SECTION 1: "What are you orchestrating?" (Product Paths) */}
      {/* ============================================================ */}
      <section id="product" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="space-y-8 sm:space-y-10">
          <div className="max-w-2xl space-y-2.5">
            <span className="text-[12px] font-mono text-[#A6F275] tracking-wide uppercase">
              Orchestration Lifecycle
            </span>
            <h2 className="font-display text-[24px] sm:text-[32px] md:text-[36px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.1]">
              What are you orchestrating?
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] leading-relaxed">
              Connect WebMCP applications, define how consequential actions recover, and compose them into durable multi-step workflows.
            </p>
          </div>

          {/* Three Lateral Stagger Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Connect Services */}
            <div className="product-card-1 p-5 sm:p-6 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono text-[#73777D]">01 · Discovery</span>
                <h3 className="font-display text-[17px] sm:text-[19px] font-semibold text-[#F4F4F2]">
                  Connect services
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#A0A3A8] leading-relaxed">
                  Bring WebMCP-enabled applications into MCPx and discover the tools they expose to your browser.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#050607] border border-white/[0.04] font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between text-[#73777D] text-[10px] pb-1 border-b border-white/[0.04]">
                  <span className="text-[#F4F4F2] truncate max-w-[140px]">billing.example.com</span>
                  <span className="text-[#A6F275]">6 tools found</span>
                </div>
                <div className="space-y-1 text-[#A0A3A8]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275] shrink-0"></span>
                    <span className="truncate">create_invoice</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0"></span>
                    <span className="truncate">get_invoice</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0"></span>
                    <span className="truncate">delete_invoice</span>
                  </div>
                </div>
              </div>

              <Link
                href="/app/services/new"
                className="inline-flex items-center text-[13px] font-medium text-[#A6F275] hover:underline gap-1 pt-0.5 min-h-[36px]"
              >
                Explore services →
              </Link>
            </div>

            {/* Card 2: Define Reliability */}
            <div className="product-card-2 p-5 sm:p-6 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono text-[#73777D]">02 · Contracts</span>
                <h3 className="font-display text-[17px] sm:text-[19px] font-semibold text-[#F4F4F2]">
                  Define reliability
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#A0A3A8] leading-relaxed">
                  Tell MCPx how a consequential operation should be executed, inspected, and compensated.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#050607] border border-white/[0.04] font-mono text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#73777D]">Execute</span>
                  <span className="text-[#F4F4F2] truncate">create_invoice</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#73777D]">Inspect</span>
                  <span className="text-[#A6F275] truncate">get_invoice</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#73777D]">Compensate</span>
                  <span className="text-[#F4F4F2] truncate">delete_invoice</span>
                </div>
                <div className="pt-1 border-t border-white/[0.04] flex items-center justify-between text-[9.5px] text-[#73777D]">
                  <span>Identity key</span>
                  <span className="text-[#A0A3A8] truncate">operationKey</span>
                </div>
              </div>

              <Link
                href="/app/services"
                className="inline-flex items-center text-[13px] font-medium text-[#A6F275] hover:underline gap-1 pt-0.5 min-h-[36px]"
              >
                Reliability contracts →
              </Link>
            </div>

            {/* Card 3: Compose Workflows */}
            <div className="product-card-3 p-5 sm:p-6 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono text-[#73777D]">03 · Execution</span>
                <h3 className="font-display text-[17px] sm:text-[19px] font-semibold text-[#F4F4F2]">
                  Compose workflows
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#A0A3A8] leading-relaxed">
                  Combine reliable operations into dependency-aware transactions without hardcoding the workflow into MCPx.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#050607] border border-white/[0.04] font-mono text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#F4F4F2] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275] shrink-0"></span>
                  <span className="truncate">Create customer</span>
                </div>
                <div className="pl-2 text-[#73777D] text-[9.5px]">↓</div>
                <div className="flex items-center gap-1.5 text-[#F4F4F2] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A6F275] shrink-0"></span>
                  <span className="truncate">Create workspace</span>
                </div>
                <div className="pl-2 text-[#73777D] text-[9.5px]">↓</div>
                <div className="flex items-center gap-1.5 text-[#A0A3A8] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0"></span>
                  <span className="truncate">Send invite</span>
                </div>
              </div>

              <Link
                href="/app/workflows/new"
                className="inline-flex items-center text-[13px] font-medium text-[#A6F275] hover:underline gap-1 pt-0.5 min-h-[36px]"
              >
                Build workflows →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SECTION 2: SCROLLYTELLING / UNCERTAINTY MOMENT */}
      {/* "The response disappeared. Did the write happen?" */}
      {/* ============================================================ */}
      <div id="how-it-works" className="relative border-t border-white/[0.06]">
        <div
          id="scrolly-uncertainty-container"
          className="min-h-auto lg:min-h-screen py-14 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto flex flex-col justify-center"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left Column: Narrative */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">
              <span className="text-[12px] font-mono text-[#A6F275] tracking-wide uppercase">
                Uncertain outcomes
              </span>
              <h2 className="font-display text-[24px] sm:text-[32px] md:text-[36px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.1]">
                The response disappeared. Did the write happen?
              </h2>
              <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] leading-relaxed">
                A lost response does not tell MCPx whether a consequential action actually committed. Instead of retrying blindly, MCPx asks the application that owns the state.
              </p>

              {/* Interactive Step Switcher */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[11px] text-[#73777D]">
                <button
                  onClick={() => setScrollyStage(0)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${scrollyStage === 0 ? "bg-white/10 text-[#F4F4F2] font-semibold" : "hover:text-[#F4F4F2]"}`}
                >
                  01 Dispatched
                </button>
                <span>→</span>
                <button
                  onClick={() => setScrollyStage(1)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${scrollyStage === 1 ? "bg-amber-950/80 text-amber-300 font-semibold border border-amber-500/40" : "hover:text-[#F4F4F2]"}`}
                >
                  02 IN_DOUBT
                </button>
                <span>→</span>
                <button
                  onClick={() => setScrollyStage(2)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${scrollyStage === 2 ? "bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-500/40" : "hover:text-[#F4F4F2]"}`}
                >
                  03 Inspect
                </button>
                <span>→</span>
                <button
                  onClick={() => setScrollyStage(3)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${scrollyStage === 3 ? "bg-emerald-950/80 text-[#A6F275] font-semibold border border-[#A6F275]/40" : "hover:text-[#F4F4F2]"}`}
                >
                  04 RECOVERED
                </button>
              </div>
            </div>

            {/* Right Column: Live Interactive Dynamic Stage Surface (Responsive Horizontal + Vertical Graphic) */}
            <div className="lg:col-span-7">
              <div className="p-5 sm:p-7 md:p-8 rounded-2xl bg-[#0C0D0E] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-5 sm:space-y-6 relative overflow-hidden">
                {/* Background State Glow */}
                <div
                  className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none ${
                    scrollyStage === 1
                      ? "bg-amber-500/20 opacity-100"
                      : scrollyStage === 3
                      ? "bg-[#A6F275]/20 opacity-100"
                      : "bg-white/5 opacity-40"
                  }`}
                />

                {/* State Machine Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-mono text-[#73777D]">Target Service: routing.app</span>
                    <div className="font-mono text-[13px] sm:text-[14px] text-[#F4F4F2] font-medium truncate">create_route(spec)</div>
                  </div>

                  {/* Reactive Status Badge */}
                  <div>
                    {scrollyStage === 0 && (
                      <span className="px-3 py-1 rounded-md text-[11px] font-mono bg-white/[0.08] text-[#F4F4F2] font-semibold animate-pulse">
                        EXECUTING
                      </span>
                    )}
                    {scrollyStage === 1 && (
                      <span className="px-3 py-1 rounded-md text-[11px] font-mono bg-amber-950/90 border border-amber-500/50 text-amber-300 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        IN_DOUBT
                      </span>
                    )}
                    {scrollyStage === 2 && (
                      <span className="px-3 py-1 rounded-md text-[11px] font-mono bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        RECONCILING
                      </span>
                    )}
                    {scrollyStage === 3 && (
                      <span className="px-3 py-1 rounded-md text-[11px] font-mono bg-emerald-950/90 border border-[#A6F275]/50 text-[#A6F275] font-semibold shadow-[0_0_15px_rgba(166,242,117,0.3)]">
                        ✓ RECOVERED
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Transaction Wire Channel (Desktop horizontal + Mobile vertical) */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#050607] border border-white/[0.04] font-mono text-[11.5px] sm:text-[12px] space-y-4">
                  {/* Desktop Horizontal Wire */}
                  <div className="hidden sm:block space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-[#73777D]">
                      <span>MCPx Client</span>
                      <span className="text-[#A0A3A8]">Cross-Origin Boundary</span>
                      <span>Routing Remote Host</span>
                    </div>

                    <div className="relative h-8 flex items-center justify-between px-2">
                      <div className="w-3 h-3 rounded-full bg-[#F4F4F2] shadow-sm z-10 shrink-0"></div>

                      <div className="flex-1 h-[2px] mx-2 relative bg-white/[0.08] overflow-hidden">
                        {scrollyStage === 0 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F4F4F2] to-transparent w-1/2 animate-[slide_1.2s_infinite]" />
                        )}
                        {scrollyStage === 1 && (
                          <div className="absolute left-1/3 w-1/3 h-full bg-amber-500/80 animate-pulse" />
                        )}
                        {scrollyStage === 2 && (
                          <div className="absolute inset-0 border-t border-dotted border-cyan-400" />
                        )}
                        {scrollyStage === 3 && (
                          <div className="absolute inset-0 bg-[#A6F275] shadow-[0_0_8px_#A6F275]" />
                        )}
                      </div>

                      <div
                        className={`w-3 h-3 rounded-full z-10 shrink-0 transition-colors ${
                          scrollyStage === 3
                            ? "bg-[#A6F275] shadow-[0_0_8px_#A6F275]"
                            : scrollyStage === 1
                            ? "bg-amber-400"
                            : "bg-white/40"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Mobile Vertical Transaction Channel */}
                  <div className="block sm:hidden space-y-3 py-1">
                    <div className="flex items-center justify-between text-[11px] text-[#A0A3A8]">
                      <span>MCPx Runtime</span>
                      <span className="text-[#73777D]">Client Origin</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2 space-y-2 relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F4F4F2]"></div>
                      <div className="w-[2px] h-12 bg-white/[0.1] relative overflow-hidden">
                        {scrollyStage === 0 && (
                          <div className="absolute inset-0 bg-[#F4F4F2] animate-pulse" />
                        )}
                        {scrollyStage === 1 && (
                          <div className="absolute top-1/2 left-0 w-full h-1/2 bg-amber-500 animate-pulse" />
                        )}
                        {scrollyStage === 2 && (
                          <div className="absolute inset-0 border-l border-dotted border-cyan-400" />
                        )}
                        {scrollyStage === 3 && (
                          <div className="absolute inset-0 bg-[#A6F275] shadow-[0_0_8px_#A6F275]" />
                        )}
                      </div>
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          scrollyStage === 3
                            ? "bg-[#A6F275]"
                            : scrollyStage === 1
                            ? "bg-amber-400"
                            : "bg-white/40"
                        }`}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#A0A3A8]">
                      <span>Remote routing.app</span>
                      <span className="text-[#73777D]">State Owner</span>
                    </div>
                  </div>

                  {/* Stage Narration Log */}
                  <div className="p-3 rounded-lg bg-[#0A0B0E] border border-white/[0.04] text-[11px] sm:text-[11.5px] leading-relaxed">
                    {scrollyStage === 0 && (
                      <div className="text-[#A0A3A8]">
                        <span className="text-[#F4F4F2] font-semibold">1. Mutation Dispatched: </span>
                        Solid request dispatched across origin. Awaiting network acknowledgement.
                      </div>
                    )}
                    {scrollyStage === 1 && (
                      <div className="text-amber-300">
                        <span className="font-semibold text-amber-200">2. Transport ACK Lost: </span>
                        Network response dropped. State is uncertain — mutation must NOT be blindly retried.
                      </div>
                    )}
                    {scrollyStage === 2 && (
                      <div className="text-cyan-300">
                        <span className="font-semibold text-cyan-200">3. Authoritative Inspection: </span>
                        Issuing get_route(operationKey) to query the remote authoritative state store.
                      </div>
                    )}
                    {scrollyStage === 3 && (
                      <div className="text-[#A6F275]">
                        <span className="font-semibold text-white">4. Confirmed Exists: </span>
                        Remote resource confirmed committed. Transaction reconciled to RECOVERED safely.
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar under scrolly stage */}
                <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] text-[#73777D] font-mono pt-1">
                  <span>Scroll or tap stages</span>
                  <span className="text-[#A6F275]">
                    {scrollyStage === 0 && "Step 1 of 4"}
                    {scrollyStage === 1 && "Step 2 of 4 (Uncertainty)"}
                    {scrollyStage === 2 && "Step 3 of 4 (Inspection)"}
                    {scrollyStage === 3 && "Step 4 of 4 (Complete)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Three Reliability Outcome Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 sm:pt-12 border-t border-white/[0.05] mt-10 sm:mt-12">
            <div className="space-y-1.5">
              <h3 className="font-display text-[15px] sm:text-[16px] font-semibold text-[#F4F4F2]">
                Recover uncertainty
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#A0A3A8] leading-relaxed">
                Inspect authoritative remote state instead of assuming a timed-out write failed.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-[15px] sm:text-[16px] font-semibold text-[#F4F4F2]">
                Roll back partial work
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#A0A3A8] leading-relaxed">
                Calculate compensation in reverse dependency order and verify every resource is gone.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-[15px] sm:text-[16px] font-semibold text-[#F4F4F2]">
                Keep humans in control
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#A0A3A8] leading-relaxed">
                Pause before destructive compensation and show operators exactly what MCPx plans to remove.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. SECTION 4: REFERENCE WORKFLOW & SAGA COMPENSATION */}
      {/* ============================================================ */}
      <section
        id="reference-dag-section"
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto border-t border-white/[0.06]"
      >
        <div className="space-y-8 sm:space-y-10">
          <div className="max-w-2xl space-y-2.5">
            <span className="text-[12px] font-mono text-[#A6F275] tracking-wide uppercase">
              Reference implementation
            </span>
            <h2 className="font-display text-[24px] sm:text-[32px] md:text-[36px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.1]">
              See the runtime under pressure.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] leading-relaxed">
              The included deployment workflow uses four independent WebMCP applications to demonstrate cross-origin execution, uncertainty recovery, durable state, and reverse Saga compensation.
            </p>
          </div>

          {/* Architectural DAG Layout Container */}
          <div className="dag-container p-5 sm:p-7 md:p-8 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.04]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono text-[#73777D]">Live Scenario Execution</span>
                <div className="text-[13.5px] sm:text-[14px] font-medium text-[#F4F4F2]">
                  4-Service Microservices Stack Topology
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setDagCompensating(!dagCompensating)}
                  className="px-3.5 py-2 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 font-medium text-[12px] transition-colors cursor-pointer min-h-[36px]"
                >
                  {dagCompensating ? "Reset execution" : "Trigger Saga compensation"}
                </button>
                <Link
                  href="/app"
                  className="px-3.5 py-2 rounded-lg bg-[#F4F4F2] text-[#050607] hover:bg-white font-medium text-[12px] transition-colors min-h-[36px] flex items-center"
                >
                  Run live in app
                </Link>
              </div>
            </div>

            {/* Visual DAG Flow */}
            <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto py-2">
              {/* Layer 1: Database */}
              <div className="flex justify-center">
                <div className="dag-node-db w-full max-w-sm p-3.5 rounded-xl bg-[#050607] border border-white/[0.08] flex items-center justify-between transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-[13px] font-semibold text-[#F4F4F2]">Database</div>
                    <div className="text-[11px] text-[#73777D] font-mono">create_database()</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      dagCompensating
                        ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                        : "bg-emerald-950/60 text-[#A6F275] border-[#A6F275]/30"
                    }`}
                  >
                    {dagCompensating ? "COMPENSATED" : "✓ COMMITTED"}
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="dag-line-1 h-5 w-px bg-white/[0.1]"></div>
              </div>

              {/* Layer 2: Backend */}
              <div className="flex justify-center">
                <div className="dag-node-backend w-full max-w-sm p-3.5 rounded-xl bg-[#050607] border border-white/[0.08] flex items-center justify-between transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-[13px] font-semibold text-[#F4F4F2]">Backend Compute</div>
                    <div className="text-[11px] text-[#73777D] font-mono">deploy_backend()</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      dagCompensating
                        ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                        : "bg-emerald-950/60 text-[#A6F275] border-[#A6F275]/30"
                    }`}
                  >
                    {dagCompensating ? "COMPENSATED" : "✓ BOUND"}
                  </span>
                </div>
              </div>

              <div className="dag-line-split flex justify-center items-center gap-24 sm:gap-40">
                <span className="h-5 w-px bg-white/[0.1] -rotate-25 transform origin-top"></span>
                <span className="h-5 w-px bg-white/[0.1] rotate-25 transform origin-top"></span>
              </div>

              {/* Layer 3: Routing & Frontend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="dag-node-routing p-3.5 rounded-xl bg-[#050607] border border-amber-500/30 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-semibold text-[#F4F4F2]">Routing Gateway</div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-mono border font-medium ${
                        dagCompensating
                          ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                          : "bg-emerald-950/60 text-[#A6F275] border-[#A6F275]/40"
                      }`}
                    >
                      {dagCompensating ? "COMPENSATED" : "RECOVERED"}
                    </span>
                  </div>
                  <div className="text-[10.5px] font-mono text-[#A0A3A8]">
                    IN_DOUBT → <span className="text-[#A6F275]">RECOVERED</span>
                  </div>
                </div>

                <div className="dag-node-frontend p-3.5 rounded-xl bg-[#050607] border border-rose-500/30 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-semibold text-[#F4F4F2]">Frontend Host</div>
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-rose-950/60 text-rose-300 border border-rose-500/40 font-medium">
                      FAILED
                    </span>
                  </div>
                  <div className="text-[10.5px] font-mono text-[#A0A3A8]">
                    Rejected before commit (simulated failure)
                  </div>
                </div>
              </div>

              {/* Compensation Cascade */}
              <div className="dag-approval-banner p-3.5 rounded-xl bg-[#08090B] border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#A0A3A8]">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">⚡ Human Approval Gate:</span>
                  <span className="truncate">Routing → Backend → Database</span>
                </div>
                <span className="text-[#A6F275] font-semibold">
                  {dagCompensating ? "ROLLBACK COMPLETED" : "AWAITING CONFIRMATION"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. SECTION 5: EDITORIAL LIGHT SECTION ("Why MCPx") */}
      {/* ============================================================ */}
      <section
        id="why-mcpx"
        className="bg-[#F2F2EE] text-[#111210] py-16 sm:py-24 md:py-28 px-4 sm:px-6 md:px-8 border-y border-black/[0.06] selection:bg-[#111210] selection:text-[#F2F2EE] transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto space-y-10 sm:space-y-14">
          <div className="max-w-2xl space-y-2.5">
            <span className="text-[12px] font-mono text-[#4D7C0F] tracking-wide uppercase">
              Why MCPx
            </span>
            <h2 className="font-display text-[26px] sm:text-[34px] md:text-[40px] font-bold text-[#111210] tracking-[-0.03em] leading-[1.1]">
              Reliability is a runtime concern.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#4B5563] leading-relaxed">
              Consequential browser workflows need more than successful API calls. MCPx keeps operation identity, authoritative state, transaction history, and human control in one runtime.
            </p>
          </div>

          {/* Editorial Spacious Multi-Row Grid */}
          <div className="space-y-10 sm:space-y-12">
            {/* Row 1: Dual Editorial Statements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 pb-10 sm:pb-12 border-b border-black/[0.06]">
              {/* Left: Unknown is not failure */}
              <div className="space-y-3.5 sm:space-y-4">
                <h3 className="font-display text-[19px] sm:text-[22px] font-bold text-[#111210]">
                  Unknown is not failure.
                </h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">
                  When transport acks drop, operations enter authoritative inspection rather than being written off as errors.
                </p>
                <div className="pt-1 sm:pt-2 font-mono text-[11px] text-[#4B5563] space-y-1">
                  <div className="font-semibold text-[#111210]">EXECUTING</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div className="text-[#D97706] font-semibold">IN_DOUBT</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div className="font-semibold text-[#111210]">INSPECT</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div className="text-[#15803D] font-semibold">RECOVERED</div>
                </div>
              </div>

              {/* Right: Durable by default */}
              <div className="space-y-3.5 sm:space-y-4">
                <h3 className="font-display text-[19px] sm:text-[22px] font-bold text-[#111210]">
                  Durable by default.
                </h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">
                  Every node transition, attempt, and inspection event is durably committed to PostgreSQL before downstream progression.
                </p>
                <div className="pt-1 sm:pt-2 font-mono text-[11px] text-[#4B5563] space-y-1.5">
                  <div className="font-semibold text-[#111210]">Transaction #18</div>
                  <div className="text-[#6B7280]">Event #01 · DISPATCHED</div>
                  <div className="text-[#6B7280]">Event #02 · IN_DOUBT</div>
                  <div className="text-[#6B7280]">Event #03 · RECONCILING</div>
                  <div className="text-[#15803D] font-semibold pt-1">✓ PostgreSQL persisted</div>
                </div>
              </div>
            </div>

            {/* Row 2: Center Feature Statement (No blind retry) */}
            <div className="max-w-2xl mx-auto text-left md:text-center space-y-4 py-2 pb-10 sm:pb-12 border-b border-black/[0.06]">
              <h3 className="font-display text-[19px] sm:text-[22px] font-bold text-[#111210]">
                No blind retry.
              </h3>
              <p className="text-[14px] text-[#4B5563] max-w-lg mx-auto leading-relaxed">
                Deterministic operation keys allow the runtime to query remote state before ever dispatching a repeated mutation.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-start md:justify-center gap-2 font-mono text-[11px] text-[#4B5563]">
                <span className="px-2.5 py-1 rounded bg-white border border-black/[0.06] text-[#111210] font-medium">Execute</span>
                <span>→</span>
                <span className="px-2.5 py-1 rounded bg-white border border-black/[0.06] text-[#D97706]">Response lost</span>
                <span>→</span>
                <span className="px-2.5 py-1 rounded bg-white border border-black/[0.06] text-[#111210] font-medium">Inspect state</span>
                <span>→</span>
                <span className="px-2.5 py-1 rounded bg-white border border-black/[0.06] text-[#15803D]">Resource found</span>
                <span>→</span>
                <span className="px-2.5 py-1 rounded bg-white border border-black/[0.06] text-[#111210] font-semibold">No duplicate write</span>
              </div>
            </div>

            {/* Row 3: Dual Bottom Statements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 pb-10 sm:pb-12 border-b border-black/[0.06]">
              {/* Left: Human-controlled rollback */}
              <div className="space-y-3.5">
                <h3 className="font-display text-[18px] sm:text-[20px] font-bold text-[#111210]">
                  Human-controlled rollback
                </h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">
                  Destructive Saga compensations require human verification before executing resource deletions across origins.
                </p>
                <div className="pt-1 font-mono text-[11px] text-[#4B5563] space-y-1">
                  <div className="text-[10px] text-[#6B7280]">3 resources exist:</div>
                  <div className="font-medium text-[#111210]">Routing · Backend · Database</div>
                  <div className="text-[#D97706] font-semibold pt-1">⏸ Approve rollback required</div>
                </div>
              </div>

              {/* Right: Crash recovery */}
              <div className="space-y-3.5">
                <h3 className="font-display text-[18px] sm:text-[20px] font-bold text-[#111210]">
                  Crash recovery
                </h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed">
                  Browser refresh or process termination resumes smoothly from durable state without lost transaction context.
                </p>
                <div className="pt-1 font-mono text-[11px] text-[#4B5563] space-y-1">
                  <div>Browser refreshed</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div>Transaction restored from store</div>
                  <div className="text-[#9CA3AF]">↓</div>
                  <div className="text-[#15803D] font-semibold">Reconciliation resumed</div>
                </div>
              </div>
            </div>

            {/* Row 4: Bring your own service summary */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 font-mono text-[11.5px] sm:text-[12px] text-[#4B5563]">
              <div>
                <span className="text-[#111210] font-semibold">Bring your own WebMCP service</span>
                <span className="text-[#6B7280] ml-2">· Connect compatible services without changing the runtime.</span>
              </div>
              <div className="text-[#15803D] font-semibold text-[11.5px]">
                billing.example.com → 6 tools → Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. SECTION 6: PRODUCT GENERALITY ("Your services. Your workflows.") */}
      {/* ============================================================ */}
      <section
        id="generic-flow-section"
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto border-b border-white/[0.06]"
      >
        <div className="space-y-8 sm:space-y-10">
          <div className="max-w-2xl space-y-2.5">
            <span className="text-[12px] font-mono text-[#A6F275] tracking-wide uppercase">
              Generic Product Platform
            </span>
            <h2 className="font-display text-[24px] sm:text-[32px] md:text-[36px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.1]">
              Your services. Your workflows.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] leading-relaxed">
              The included deployment is only a reference workflow. Connect compatible WebMCP services without changing the MCPx runtime.
            </p>
          </div>

          {/* Clean Horizontal/Vertical Progression Flow */}
          <div className="p-5 sm:p-7 md:p-8 rounded-2xl bg-[#0C0D0E] border border-white/[0.06] space-y-6 sm:space-y-8 relative overflow-hidden">
            {/* Animated Progression Line */}
            <div className="generic-flow-progress-bar absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#A6F275] to-transparent origin-left scale-x-0" />

            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[11.5px] sm:text-[12px] font-mono pb-5 sm:pb-6 border-b border-white/[0.06]">
              <span className="text-[#F4F4F2]">Connect service</span>
              <span className="text-[#73777D]">→</span>
              <span className="text-[#F4F4F2]">Discover tools</span>
              <span className="text-[#73777D]">→</span>
              <span className="text-[#F4F4F2]">Define contract</span>
              <span className="text-[#73777D]">→</span>
              <span className="text-[#F4F4F2]">Build workflow</span>
              <span className="text-[#73777D]">→</span>
              <span className="text-[#A6F275] font-semibold">Run reliably</span>
            </div>

            {/* Realistic External Fixture Progression */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 font-mono text-[11.5px]">
              <div className="p-4 rounded-xl bg-[#050607] border border-white/[0.04] space-y-2">
                <div className="text-[#F4F4F2] font-semibold text-[13px]">Widget Factory</div>
                <div className="text-[11px] text-[#A6F275]">9 tools discovered</div>
                <div className="text-[#73777D] text-[10.5px] space-y-0.5 pt-1">
                  <div className="truncate">create_widget</div>
                  <div className="truncate">get_widget</div>
                  <div className="truncate">delete_widget</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#050607] border border-white/[0.04] space-y-2">
                <div className="text-[#F4F4F2] font-semibold text-[13px]">Create Widget Contract</div>
                <div className="text-[11px] text-[#A6F275]">READY</div>
                <div className="text-[#73777D] text-[10.5px] space-y-0.5 pt-1">
                  <div className="truncate">Execute: create_widget</div>
                  <div className="truncate">Inspect: get_widget</div>
                  <div className="truncate">Compensate: delete_widget</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#050607] border border-white/[0.04] space-y-2">
                <div className="text-[#F4F4F2] font-semibold text-[13px]">Widget Publishing Workflow</div>
                <div className="text-[11px] text-[#A6F275]">2 operations · Ready to run</div>
                <div className="text-[#73777D] text-[10.5px] space-y-0.5 pt-1">
                  <div className="truncate">Create Widget → Publish Catalog</div>
                  <div className="text-[#A0A3A8] truncate">Deterministic operationKey bound</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. SECTION 7: FINAL CALL TO ACTION */}
      {/* ============================================================ */}
      <section
        id="final-cta-section"
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-center space-y-6"
      >
        <h2 className="font-display text-[26px] sm:text-[34px] md:text-[38px] font-bold text-[#F4F4F2] tracking-[-0.03em] leading-[1.08] overflow-hidden">
          <span className="block overflow-hidden py-1">
            <span className="final-cta-line block">Build workflows that know what happened.</span>
          </span>
        </h2>
        <p className="text-[14px] sm:text-[16px] text-[#A0A3A8] max-w-[480px] mx-auto leading-relaxed">
          Connect WebMCP services and run consequential actions with durable execution, authoritative reconciliation, and controlled rollback.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full sm:w-auto">
          <Link
            href="/app"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-medium bg-[#F4F4F2] text-[#050607] hover:bg-white transition-all cursor-pointer shadow-sm text-center min-h-[44px] flex items-center justify-center"
          >
            Open MCPx
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#F4F4F2] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. STRUCTURED FOOTER */}
      {/* ============================================================ */}
      <footer className="border-t border-white/[0.06] py-10 sm:py-12 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto text-xs text-[#73777D]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 sm:pb-10 border-b border-white/[0.04]">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <span className="w-1.5 h-1.5 rounded-[0.5px] bg-[#A6F275]"></span>
                <span className="w-1.5 h-1.5 rounded-[0.5px] bg-white/80"></span>
                <span className="w-1.5 h-1.5 rounded-[0.5px] bg-white/40"></span>
                <span className="w-1.5 h-1.5 rounded-[0.5px] bg-white/80"></span>
              </div>
              <span className="text-[#F4F4F2] font-semibold text-[15px]">MCPx</span>
            </div>
            <p className="text-[13px] text-[#A0A3A8] max-w-sm leading-relaxed">
              Reliability runtime for WebMCP workflows. Durable transaction execution, authoritative reconciliation, and human-gated rollback.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-[12px] font-semibold text-[#F4F4F2] uppercase tracking-wider">Navigation</div>
            <div className="space-y-1.5 text-[13px] text-[#A0A3A8] flex flex-col">
              <a href="#product" className="hover:text-[#F4F4F2] transition-colors py-1">Product</a>
              <a href="#how-it-works" className="hover:text-[#F4F4F2] transition-colors py-1">How it works</a>
              <Link href="/app" className="hover:text-[#F4F4F2] transition-colors py-1">Open app</Link>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[12px] font-semibold text-[#F4F4F2] uppercase tracking-wider">Resources</div>
            <div className="space-y-1.5 text-[13px] text-[#A0A3A8] flex flex-col">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#F4F4F2] transition-colors py-1">GitHub Repository</a>
              <Link href="/app/services/new" className="hover:text-[#F4F4F2] transition-colors py-1">Connect Service</Link>
              <Link href="/app/workflows/new" className="hover:text-[#F4F4F2] transition-colors py-1">Workflow Builder</Link>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-[#73777D]">
          <span>Apache-2.0 Open Source License</span>
          <span>WebMCP Reliability Runtime Architecture</span>
        </div>
      </footer>
    </div>
  );
}
