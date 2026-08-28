"use client";

import { useState } from "react";
import type { ToolResult } from "@/types/webmcp";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";
import { useWebMCPDiscovery } from "@/hooks/useWebMCPDiscovery";
import { useDeploymentDemo } from "@/hooks/useDeploymentDemo";
import { useCompensationDemo } from "@/hooks/useCompensationDemo";
import { useReliabilityDemo } from "@/hooks/useReliabilityDemo";
import WebMCPBridgeStatus from "@/components/WebMCPBridgeStatus";
import DeploymentDemo from "@/components/DeploymentDemo";
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

  // Discovery Hook (4 microservices)
  const {
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
  } = useWebMCPDiscovery();

  // Milestone 3: 4-Service Deployment DAG Hook
  const {
    transaction: deployTx,
    isRunning: isRunningDeploy,
    eventLog: deployLog,
    authoritativeState: deployAuth,
    runDeployment,
    inspectAllResources,
    resetDeployment,
    clearEventLog: clearDeployLog,
  } = useDeploymentDemo(registeredToolsRef);

  // Milestone 2: Saga Compensation Demo Hook
  const {
    transaction: sagaTx,
    isRunning: isRunningSaga,
    eventLog: sagaLog,
    authoritativeState: sagaAuth,
    runCompensationDemo,
    approveCompensation,
    rejectCompensation,
    resetCompensationDemo,
    clearEventLog: clearSagaLog,
  } = useCompensationDemo(registeredToolsRef);

  // Milestone 1: Reliability Demo Hook (drop-ack-after-commit -> IN_DOUBT -> RECOVERED)
  const {
    reliabilityOpKey,
    setReliabilityOpKey,
    isRunning: isRunningReliability,
    transactionNode: reliabilityNode,
    eventLog: reliabilityLog,
    authoritativeState: reliabilityAuth,
    runReliabilityDemo,
    resetReliabilityDemo,
    clearEventLog: clearReliabilityLog,
  } = useReliabilityDemo(registeredToolsRef);

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
      {/* 1. WebMCP Bridges Status for All 4 Services */}
      <WebMCPBridgeStatus
        isDatabaseConnected={isDatabaseConnected}
        isComputeConnected={isComputeConnected}
        isRoutingConnected={isRoutingConnected}
        isFrontendConnected={isFrontendConnected}
        isSupported={isSupported}
        databaseTools={databaseTools}
        computeTools={computeTools}
        routingTools={routingTools}
        frontendTools={frontendTools}
        discoveryError={discoveryError}
        onRefreshTools={discoverTools}
        disabled={executingTool !== null || isRunningDeploy || isRunningSaga || isRunningReliability}
      />

      {/* 2. Final Milestone: 4-Service Deployment DAG */}
      <DeploymentDemo
        transaction={deployTx}
        isRunning={isRunningDeploy}
        isConnected={isConnected}
        eventLog={deployLog}
        authoritativeState={deployAuth}
        onRunDeployment={runDeployment}
        onInspectAll={inspectAllResources}
        onReset={resetDeployment}
        onClearLog={clearDeployLog}
      />

      {/* 3. Milestone 2: Saga Compensation Demo */}
      <CompensationDemo
        transaction={sagaTx}
        isRunning={isRunningSaga}
        isConnected={isConnected}
        eventLog={sagaLog}
        authoritativeState={sagaAuth}
        onRunDemo={runCompensationDemo}
        onApproveCompensation={approveCompensation}
        onRejectCompensation={rejectCompensation}
        onResetDemo={resetCompensationDemo}
        onClearLog={clearSagaLog}
      />

      {/* 4. Milestone 1: Reliability Recovery Demo */}
      <ReliabilityDemo
        reliabilityOpKey={reliabilityOpKey}
        onOpKeyChange={setReliabilityOpKey}
        isRunning={isRunningReliability}
        isConnected={isRoutingConnected}
        transactionNode={reliabilityNode}
        eventLog={reliabilityLog}
        authoritativeState={reliabilityAuth}
        onRunDemo={runReliabilityDemo}
        onResetDemo={resetReliabilityDemo}
        onClearLog={clearReliabilityLog}
      />

      {/* 5. Manual Controls (Day-1 Proof) */}
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

      {/* 6. Embedded Microservices (4 Ports) */}
      <EmbeddedServices
        databaseIframeRef={databaseIframeRef}
        computeIframeRef={computeIframeRef}
        routingIframeRef={routingIframeRef}
        frontendIframeRef={frontendIframeRef}
        onLoad={discoverTools}
      />
    </div>
  );
}
