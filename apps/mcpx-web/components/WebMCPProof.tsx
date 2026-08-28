"use client";

import { useState } from "react";
import type { ToolResult } from "@/types/webmcp";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";
import { useWebMCPDiscovery } from "@/hooks/useWebMCPDiscovery";
import { useReliabilityDemo } from "@/hooks/useReliabilityDemo";
import { useCompensationDemo } from "@/hooks/useCompensationDemo";
import WebMCPBridgeStatus from "@/components/WebMCPBridgeStatus";
import CompensationDemo from "@/components/CompensationDemo";
import ReliabilityDemo from "@/components/ReliabilityDemo";
import ManualWebMCPControls from "@/components/ManualWebMCPControls";
import EmbeddedServices from "@/components/EmbeddedServices";

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
    routingTools,
    databaseTools,
    isConnected,
    isRoutingConnected,
    isDatabaseConnected,
    isSupported,
    discoveryError,
    registeredToolsRef,
    routingIframeRef,
    databaseIframeRef,
    discoverTools,
  } = useWebMCPDiscovery();

  // Reliability Demo Hook (Day-1 Regression)
  const {
    reliabilityOpKey,
    setReliabilityOpKey,
    isRunning: isRunningReliabilityDemo,
    transactionNode: reliabilityNode,
    eventLog: reliabilityEventLog,
    authoritativeState: reliabilityAuth,
    runReliabilityDemo,
    resetReliabilityDemo,
    clearEventLog: clearReliabilityLog,
  } = useReliabilityDemo(registeredToolsRef);

  // Saga Compensation Demo Hook (Milestone 2)
  const {
    transaction,
    isRunning: isRunningSaga,
    eventLog: sagaEventLog,
    authoritativeState: sagaAuth,
    runCompensationDemo,
    approveCompensation,
    rejectCompensation,
    resetCompensationDemo,
    clearEventLog: clearSagaLog,
  } = useCompensationDemo(registeredToolsRef);

  // Manual tool execution
  const executeWebMCPTool = async (toolName: string, args: Record<string, unknown>) => {
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
      {/* 1. WebMCP Bridges Status for Routing & Database */}
      <WebMCPBridgeStatus
        isRoutingConnected={isRoutingConnected}
        isDatabaseConnected={isDatabaseConnected}
        isSupported={isSupported}
        routingTools={routingTools}
        databaseTools={databaseTools}
        discoveryError={discoveryError}
        onRefreshTools={discoverTools}
        disabled={executingTool !== null || isRunningReliabilityDemo || isRunningSaga}
      />

      {/* 2. Saga Compensation Demo (Milestone 2) */}
      <CompensationDemo
        transaction={transaction}
        isRunning={isRunningSaga}
        isConnected={isConnected}
        eventLog={sagaEventLog}
        authoritativeState={sagaAuth}
        onRunDemo={runCompensationDemo}
        onApproveCompensation={approveCompensation}
        onRejectCompensation={rejectCompensation}
        onResetDemo={resetCompensationDemo}
        onClearLog={clearSagaLog}
      />

      {/* 3. Reliability Demo (Milestone 1 Regression: IN_DOUBT -> RECONCILING -> RECOVERED) */}
      <ReliabilityDemo
        reliabilityOpKey={reliabilityOpKey}
        onOpKeyChange={setReliabilityOpKey}
        isRunning={isRunningReliabilityDemo}
        isConnected={isRoutingConnected}
        transactionNode={reliabilityNode}
        eventLog={reliabilityEventLog}
        authoritativeState={reliabilityAuth}
        onRunDemo={runReliabilityDemo}
        onResetDemo={resetReliabilityDemo}
        onClearLog={clearReliabilityLog}
      />

      {/* 4. Manual WebMCP Controls (Day-1 Proof) */}
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

      {/* 5. Embedded Resource Providers */}
      <EmbeddedServices
        routingIframeRef={routingIframeRef}
        databaseIframeRef={databaseIframeRef}
        onLoad={discoverTools}
      />
    </div>
  );
}
