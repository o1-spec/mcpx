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
  // Developer Details Collapsed State (Collapsed by default for clean presentation)
  const [showDevDetails, setShowDevDetails] = useState(false);

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

  // Milestone: Durable Coordinator & Real Postgres Resource Plane
  const {
    transaction: deployTx,
    isRunning: isRunningDeploy,
    isHydrating: isHydratingDeploy,
    pauseBeforeReconcile,
    setPauseBeforeReconcile,
    eventLog: deployLog,
    authoritativeState: deployAuth,
    runDeployment,
    approveCompensation: approveDeployCompensation,
    rejectCompensation: rejectDeployCompensation,
    inspectAllResources,
    rehydrateTransaction,
    resetDeployment,
    clearEventLog: clearDeployLog,
  } = useDeploymentDemo(registeredToolsRef);

  // Milestone 2: 2-Node Saga Compensation Demo Hook
  const {
    transaction: sagaTx,
    isRunning: isRunningSaga,
    eventLog: sagaLog,
    authoritativeState: sagaAuth,
    runCompensationDemo,
    approveCompensation: approveSagaCompensation,
    rejectCompensation: rejectSagaCompensation,
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
    <div className="space-y-6">
      {/* 1. Main Challenge Demo Experience */}
      <DeploymentDemo
        transaction={deployTx}
        isRunning={isRunningDeploy}
        isHydrating={isHydratingDeploy}
        isConnected={isConnected}
        pauseBeforeReconcile={pauseBeforeReconcile}
        onSetPauseBeforeReconcile={setPauseBeforeReconcile}
        eventLog={deployLog}
        authoritativeState={deployAuth}
        onRunDeployment={runDeployment}
        onApproveCompensation={approveDeployCompensation}
        onRejectCompensation={rejectDeployCompensation}
        onInspectAll={inspectAllResources}
        onRehydrate={rehydrateTransaction}
        onReset={resetDeployment}
        onClearLog={clearDeployLog}
      />

      {/* 2. Developer Details & Low-Level Diagnostics (Collapsed by default) */}
      <div className="pt-2">
        <button
          onClick={() => setShowDevDetails(!showDevDetails)}
          className="w-full py-3 px-4 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/40 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span>{showDevDetails ? "▾" : "▸"}</span>
            <span>Developer details & diagnostics</span>
          </span>
          <span className="text-[11px] text-slate-500 font-normal">
            {showDevDetails ? "Collapse" : "Low-level tools, microservice iframes, and test controls"}
          </span>
        </button>

        {showDevDetails && (
          <div className="mt-4 space-y-6 animate-in fade-in duration-200">
            {/* Crash Recovery Pause Option */}
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 text-xs space-y-2">
              <span className="font-semibold text-slate-300 block">
                Coordinator crash recovery test
              </span>
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pauseBeforeReconcile}
                  onChange={(e) => setPauseBeforeReconcile(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Pause after IN_DOUBT (Enables browser refresh to verify reconciliation recovery)</span>
              </label>
            </div>

            {/* Microservice Host Origins */}
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 text-xs font-mono space-y-2 text-slate-400">
              <span className="font-sans font-semibold text-slate-300 block">
                Microservice host ports
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>Database: <span className="text-slate-300">:3002</span></div>
                <div>Compute: <span className="text-slate-300">:3003</span></div>
                <div>Routing: <span className="text-slate-300">:3001</span></div>
                <div>Frontend: <span className="text-slate-300">:3004</span></div>
              </div>
            </div>

            {/* WebMCP Bridge Status Detail */}
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

            {/* Milestone 2 Saga Compensation Demo */}
            <CompensationDemo
              transaction={sagaTx}
              isRunning={isRunningSaga}
              isConnected={isConnected}
              eventLog={sagaLog}
              authoritativeState={sagaAuth}
              onRunDemo={runCompensationDemo}
              onApproveCompensation={approveSagaCompensation}
              onRejectCompensation={rejectSagaCompensation}
              onResetDemo={resetCompensationDemo}
              onClearLog={clearSagaLog}
            />

            {/* Milestone 1 Reliability Demo */}
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

            {/* Manual Direct Tool Invocation */}
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

            {/* Embedded Microservice Iframes (ports 3001, 3002, 3003, 3004) */}
            <EmbeddedServices
              databaseIframeRef={databaseIframeRef}
              computeIframeRef={computeIframeRef}
              routingIframeRef={routingIframeRef}
              frontendIframeRef={frontendIframeRef}
              onLoad={discoverTools}
            />
          </div>
        )}
      </div>
    </div>
  );
}
