"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { RegisteredTool } from "@/types/webmcp";
import type { DiscoveredToolInfo } from "@/types/reliability";

export function useWebMCPDiscovery() {
  const [discoveredTools, setDiscoveredTools] = useState<DiscoveredToolInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  // Store browser-owned RegisteredTool objects safely in ref (non-serialized)
  const registeredToolsRef = useRef<RegisteredTool[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const discoverTools = useCallback(async () => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    if (!document.modelContext || typeof document.modelContext.getTools !== "function") {
      setIsSupported(false);
      setIsConnected(false);
      return;
    }

    setIsSupported(true);
    setDiscoveryError(null);
    console.log("[mcpx-web] requesting tools from http://localhost:3001");

    try {
      const tools = await document.modelContext.getTools({
        fromOrigins: ["http://localhost:3001"],
      });

      console.log("[mcpx-web] tools returned", tools);

      registeredToolsRef.current = tools || [];

      const toolInfos: DiscoveredToolInfo[] = (tools || []).map((t) => ({
        name: t.name,
        origin: t.origin,
        description: t.description,
      }));

      setDiscoveredTools(toolInfos);
      setIsConnected(toolInfos.length > 0);
    } catch (err: unknown) {
      console.error("[mcpx-web] getTools error:", err);
      const errName = (err && typeof err === "object" && "name" in err) ? String(err.name) : "Error";
      const errMsg = (err && typeof err === "object" && "message" in err) ? String(err.message) : String(err);
      setDiscoveryError(`${errName}: ${errMsg}`);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    if (!document.modelContext) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const handleToolChange = (event: Event) => {
      console.log("[mcpx-web] toolchange event received:", event);
      discoverTools();
    };

    if (typeof document.modelContext.addEventListener === "function") {
      document.modelContext.addEventListener("toolchange", handleToolChange);
    }

    discoverTools();

    return () => {
      if (
        document.modelContext &&
        typeof document.modelContext.removeEventListener === "function"
      ) {
        document.modelContext.removeEventListener("toolchange", handleToolChange);
      }
    };
  }, [discoverTools]);

  return {
    discoveredTools,
    isConnected,
    isSupported,
    discoveryError,
    registeredToolsRef,
    iframeRef,
    discoverTools,
  };
}
