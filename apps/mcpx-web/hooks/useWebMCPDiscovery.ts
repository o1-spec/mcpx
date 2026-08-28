"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { RegisteredTool } from "@/types/webmcp";
import type { DiscoveredToolInfo } from "@/types/reliability";
import { origins } from "@/lib/config/origins";

export function useWebMCPDiscovery() {
  const [discoveredTools, setDiscoveredTools] = useState<DiscoveredToolInfo[]>([]);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  // Store browser-owned RegisteredTool objects safely in ref (non-serialized)
  const registeredToolsRef = useRef<RegisteredTool[]>([]);
  const routingIframeRef = useRef<HTMLIFrameElement>(null);
  const databaseIframeRef = useRef<HTMLIFrameElement>(null);
  const computeIframeRef = useRef<HTMLIFrameElement>(null);
  const frontendIframeRef = useRef<HTMLIFrameElement>(null);

  const discoverTools = useCallback(async () => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    if (!document.modelContext || typeof document.modelContext.getTools !== "function") {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setDiscoveryError(null);

    try {
      // Query tools from configured reference microservice origins
      const tools = await document.modelContext.getTools({
        fromOrigins: [
          origins.routing,
          origins.database,
          origins.compute,
          origins.frontend,
        ],
      });

      registeredToolsRef.current = tools || [];

      const toolInfos: DiscoveredToolInfo[] = (tools || []).map((t) => ({
        name: t.name,
        origin: t.origin,
        description: t.description,
      }));

      setDiscoveredTools(toolInfos);
    } catch (err: unknown) {
      console.error("[mcpx-web] getTools error:", err);
      const errName = err && typeof err === "object" && "name" in err ? String(err.name) : "Error";
      const errMsg = err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
      setDiscoveryError(`${errName}: ${errMsg}`);
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

  const databaseTools = discoveredTools.filter(
    (t) =>
      t.origin?.includes(":3002") ||
      ["create_database", "get_database", "delete_database"].includes(t.name)
  );

  const computeTools = discoveredTools.filter(
    (t) =>
      t.origin?.includes(":3003") ||
      ["deploy_backend", "get_backend", "delete_backend"].includes(t.name)
  );

  const routingTools = discoveredTools.filter(
    (t) =>
      t.origin?.includes(":3001") ||
      ["create_route", "get_route", "delete_route"].includes(t.name)
  );

  const frontendTools = discoveredTools.filter(
    (t) =>
      t.origin?.includes(":3004") ||
      ["deploy_frontend", "get_frontend", "delete_frontend"].includes(t.name)
  );

  const isDatabaseConnected = ["create_database", "get_database", "delete_database"].every((name) =>
    discoveredTools.some((t) => t.name === name)
  );

  const isComputeConnected = ["deploy_backend", "get_backend", "delete_backend"].every((name) =>
    discoveredTools.some((t) => t.name === name)
  );

  const isRoutingConnected = ["create_route", "get_route", "delete_route"].every((name) =>
    discoveredTools.some((t) => t.name === name)
  );

  const isFrontendConnected = ["deploy_frontend", "get_frontend", "delete_frontend"].every((name) =>
    discoveredTools.some((t) => t.name === name)
  );

  const isConnected = isDatabaseConnected && isComputeConnected && isRoutingConnected && isFrontendConnected;

  return {
    discoveredTools,
    databaseTools,
    computeTools,
    routingTools,
    frontendTools,
    isConnected,
    isDatabaseConnected,
    isComputeConnected,
    isRoutingConnected,
    isFrontendConnected,
    isSupported,
    discoveryError,
    registeredToolsRef,
    databaseIframeRef,
    computeIframeRef,
    routingIframeRef,
    frontendIframeRef,
    discoverTools,
  };
}
