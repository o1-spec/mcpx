"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import LandingLoader from "@/components/landing/LandingLoader";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import UncertaintySection from "@/components/landing/UncertaintySection";
import PrimitivesSection from "@/components/landing/PrimitivesSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import TopologySection from "@/components/landing/TopologySection";
import HumanGateSection from "@/components/landing/HumanGateSection";
import PlatformSection from "@/components/landing/PlatformSection";
import GroundTruthSection from "@/components/landing/GroundTruthSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Scrollytelling / Hero runtime visual state
  const [heroTraceStage, setHeroTraceStage] = useState<0 | 1 | 2 | 3>(0);
  const [dagCompensating, setDagCompensating] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

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

      // 4. MINIMAL GEOMETRIC STATE RESOLUTION LOADER (~1.3s)
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

      {/* Intro Loader */}
      <LandingLoader ref={loaderRef} />

      {/* Sticky Header */}
      <LandingHeader ref={headerRef} />

      {/* Hero Section */}
      <HeroSection
        heroTraceStage={heroTraceStage}
        setHeroTraceStage={setHeroTraceStage}
      />

      {/* The Problem Section */}
      <UncertaintySection />

      {/* Primitives Section */}
      <PrimitivesSection />

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Reference Topology DAG Section */}
      <TopologySection
        dagCompensating={dagCompensating}
        setDagCompensating={setDagCompensating}
      />

      {/* Human Gate Section */}
      <HumanGateSection />

      {/* Platform Section */}
      <PlatformSection />

      {/* Ground Truth Section */}
      <GroundTruthSection />

      {/* Final CTA Section */}
      <FinalCtaSection />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
