"use client";

import { useState } from "react";
import type { ToolResult } from "@/types/webmcp";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";
import { useWebMCPDiscovery } from "@/hooks/useWebMCPDiscovery";
import { useReliabilityDemo } from "@/hooks/useReliabilityDemo";
import WebMCPBridgeStatus from "@/components/WebMCPBridgeStatus";
import ReliabilityDemo from "@/components/ReliabilityDemo";
import ManualWebMCPControls from "@/components/ManualWebMCPControls";
import EmbeddedRoutingIframe from "@/components/EmbeddedRoutingIframe";

export default function WebMCPProof() {
  // Manual Controls State
  const [operationKey, setOperationKey] = useState("tx:demo-001:routing:create");
  const [projectName, setProjectName] = useState("mcpx-demo");
  const [targetUrl, setTargetUrl] = useState("http://localhost:4000");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [executingTool, setExecutingTool] = useState<string | null>(null);

  // Discovery Hook
  const {
    discoveredTools,
    isConnected,
    isSupported,
    discoveryError,
    registeredToolsRef,
    iframeRef,
    discoverTools,
  } = useWebMCPDiscovery();

  // Reliability Demo Hook
  const {
    reliabilityOpKey,
    setReliabilityOpKey,
    isRunning: isRunningReliabilityDemo,
    transactionNode,
    eventLog,
    authoritativeState,
    runReliabilityDemo,
    resetReliabilityDemo,
    clearEventLog,
  } = useReliabilityDemo(registeredToolsRef);

  // Manual WebMCP tool execution
  const executeWebMCPTool = async (
    toolName: string,
    args: Record<string, unknown>
  ) => {
    if (typeof document === "undefined" || !document.modelContext) {
      setLastResult(JSON.stringify({ error: "document.modelContext is unavailable." }, null, 2));
      return;
    }

    const tool = registeredToolsRef.current.find((t) => t.name === toolName);
    if (!tool) {
      const discoveredNames = discoveredTools.map((t) => t.name).join(", ") || "none";
      setLastResult(
        JSON.stringify({ error: `Tool '${toolName}' not found among discovered tools (${discoveredNames})` }, null, 2)
      );
      return;
    }

    setExecutingTool(toolName);
    try {
      console.log(`[mcpx-web] executing ${toolName} with args:`, args);
      const rawResult: ToolResult = await document.modelContext.executeTool(tool, JSON.stringify(args));
      const normalized = normalizeWebMCPResult(rawResult);
      setLastResult(JSON.stringify(normalized, null, 2));
    } catch (err: unknown) {
      console.error(`[mcpx-web] executeTool ${toolName} failed:`, err);
      const msg = err instanceof Error ? err.message : String(err);
      setLastResult(JSON.stringify({ error: `WebMCP execution failed: ${msg}` }, null, 2));
    } finally {
      setExecutingTool(null);
    }
  };

  return (
    <div className="space-y-10">
      {/* WebMCP Bridge Status */}
      <WebMCPBridgeStatus
        isConnected={isConnected}
        isSupported={isSupported}
        discoveredTools={discoveredTools}
        discoveryError={discoveryError}
        onRefreshTools={discoverTools}
        disabled={executingTool !== null || isRunningReliabilityDemo}
      />

      {/* Reliability Demo */}
      <ReliabilityDemo
        reliabilityOpKey={reliabilityOpKey}
        onOpKeyChange={setReliabilityOpKey}
        isRunning={isRunningReliabilityDemo}
        isConnected={isConnected}
        transactionNode={transactionNode}
        eventLog={eventLog}
        authoritativeState={authoritativeState}
        onRunDemo={runReliabilityDemo}
        onResetDemo={resetReliabilityDemo}
        onClearLog={clearEventLog}
      />

      {/* Manual WebMCP Controls */}
      <ManualWebMCPControls
        operationKey={operationKey}
        projectName={projectName}
        targetUrl={targetUrl}
        onOperationKeyChange={setOperationKey}
        onProjectNameChange={setProjectName}
        onTargetUrlChange={setTargetUrl}
        onCreateRoute={() =>
          executeWebMCPTool("create_route", {
            projectName,
            targetUrl,
            operationKey,
            failureMode: "none",
          })
        }
        onInspectRoute={() => executeWebMCPTool("get_route", { operationKey })}
        onDeleteRoute={() => executeWebMCPTool("delete_route", { operationKey })}
        lastResult={lastResult}
        onClearResult={() => setLastResult(null)}
        executingTool={executingTool}
      />

      {/* Embedded Routing Application Iframe */}
      <EmbeddedRoutingIframe
        iframeRef={iframeRef}
        onLoad={discoverTools}
      />
    </div>
  );
}
