"use client";

import { forwardRef } from "react";
import gsap from "gsap";

interface LandingLoaderProps {
  onDismiss?: () => void;
}

export const LandingLoader = forwardRef<HTMLDivElement, LandingLoaderProps>(
  function LandingLoader({ onDismiss }, ref) {
    const handleClick = () => {
      if (typeof ref === "object" && ref?.current) {
        gsap.to(ref.current, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            if (ref.current) ref.current.style.display = "none";
            onDismiss?.();
          },
        });
      }
    };

    return (
      <div
        ref={ref}
        onClick={handleClick}
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
            <line
              x1="180"
              y1="180"
              x2="180"
              y2="75"
              className="loader-line-top stroke-white/25 stroke-[1.5]"
            />
            <line
              x1="180"
              y1="180"
              x2="180"
              y2="285"
              className="loader-line-bottom stroke-white/25 stroke-[1.5]"
            />
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
            <g className="loader-node-top" transform="translate(180, 75)">
              <circle r="4" className="fill-[#070708] stroke-white/40 stroke-[1.5]" />
              <circle r="1.5" className="fill-white/80" />
            </g>
            <g className="loader-node-bottom" transform="translate(180, 285)">
              <circle r="4" className="fill-[#070708] stroke-white/40 stroke-[1.5]" />
              <circle r="1.5" className="fill-white/80" />
            </g>
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
              <span className="loader-tile-lime w-2 h-2 bg-accent-lime rounded-[0.5px]" />
              <span className="loader-tile-1 w-2 h-2 bg-foreground opacity-90 rounded-[0.5px]" />
              <span className="loader-tile-2 w-2 h-2 bg-foreground opacity-35 rounded-[0.5px]" />
              <span className="loader-tile-3 w-2 h-2 bg-foreground opacity-80 rounded-[0.5px]" />
            </div>
            <span className="loader-brand-text text-xs font-medium tracking-tight text-foreground font-sans opacity-90">
              MCPx
            </span>
          </div>
        </div>
      </div>
    );
  }
);

LandingLoader.displayName = "LandingLoader";
export default LandingLoader;
