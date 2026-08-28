"use client";

import { useEffect, useRef } from "react";

interface WebMCPServiceFrameProps {
  origin: string;
  onLoad?: () => void;
}

export default function WebMCPServiceFrame({ origin, onLoad }: WebMCPServiceFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log(`[mcpx-host] dynamic service iframe loaded: ${origin}`);
      onLoad?.();
    };

    iframe.addEventListener("load", handleLoad);
    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [origin, onLoad]);

  if (!origin) return null;

  return (
    <iframe
      ref={iframeRef}
      src={origin}
      allow="tools"
      title={`WebMCP Service Host: ${origin}`}
      style={{
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        width: "1px",
        height: "1px",
        opacity: 0.001,
        pointerEvents: "none",
        border: "none",
      }}
    />
  );
}
