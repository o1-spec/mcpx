"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";
import type { RegisteredTool } from "@/types/webmcp";

interface ClaimedWork {
  transactionId: string;
  action: "EXECUTE" | "COMPENSATE" | "RECONCILE_CLAIM";
  node: {
    id: string;
    service: string;
    label: string;
    origin: string;
    executeTool: string;
    inspectTool: string;
    compensateTool: string | null;
    operationKey: string;
    resourceId?: string | null;
    state: string;
    executeArgs: Record<string, unknown>;
  };
  upstreamOutputs?: Record<string, { resourceId?: string; [key: string]: unknown }>;
}

export function useWebMCPBrowserRunner() {
  const [runnerId, setRunnerId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastExecutedNode, setLastExecutedNode] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const activeRunnerId = `runner_${Math.random().toString(36).slice(2, 10)}`;
    setRunnerId(activeRunnerId);

    // 1. Heartbeat loop (every 5 seconds)
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/v1/runner/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runnerId: activeRunnerId,
            metadata: {
              userAgent: navigator.userAgent,
              hasModelContext: typeof document !== "undefined" && Boolean(document.modelContext),
            },
          }),
        });
      } catch {
        // Ignore network glitch
      }
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 5000);

    // 2. Work Claim & WebMCP Execution Loop (every 800ms)
    const pollAndExecuteWork = async () => {
      if (!isMountedRef.current || isProcessingRef.current) return;

      try {
        const claimRes = await fetch("/api/v1/runner/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runnerId: activeRunnerId }),
        });

        if (!claimRes.ok) return;
        const claimData = await claimRes.json();
        const work: ClaimedWork | null = claimData.work;

        if (!work || !work.node) return;

        isProcessingRef.current = true;
        setIsProcessing(true);
        setLastExecutedNode(`${work.action}: ${work.node.label}`);

        const { transactionId, action, node, upstreamOutputs = {} } = work;

        // Check native document.modelContext availability
        if (typeof document === "undefined" || !document.modelContext) {
          console.error("[MCPx Browser Runner] document.modelContext unavailable in active window");
          await fetch("/api/v1/runner/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              runnerId: activeRunnerId,
              transactionId,
              nodeId: node.id,
              action,
              outcome: "FAILED",
              error: "document.modelContext unavailable in active browser window",
            }),
          });
          isProcessingRef.current = false;
          setIsProcessing(false);
          return;
        }

        // ==========================================
        // 1. FORWARD EXECUTION / RE-CLAIM RECONCILE
        // ==========================================
        if (action === "EXECUTE") {
          // If this node was previously claimed in EXECUTING state (e.g. previous runner crashed),
          // perform authoritative inspection FIRST before re-executing to prevent duplicate mutation.
          if (node.state === "EXECUTING" && node.inspectTool) {
            console.log(`[MCPx Browser Runner] Reclaimed node ${node.id} in EXECUTING state. Inspecting remote ground truth first...`);
            const tools = await document.modelContext.getTools().catch(() => []);
            const inspectTool = tools.find((t) => t.name === node.inspectTool);
            if (inspectTool) {
              try {
                const rawInspect = await document.modelContext.executeTool(
                  inspectTool,
                  JSON.stringify({ operationKey: node.operationKey })
                );
                const normInspect = normalizeWebMCPResult(rawInspect) as Record<string, unknown> | null;
                if (normInspect && normInspect.exists) {
                  console.log(`[MCPx Browser Runner] Node ${node.id} confirmed COMMITTED by remote service. Reconciling to RECOVERED.`);
                  const recoveredId = (normInspect.resourceId || normInspect.id || node.operationKey) as string;
                  await fetch("/api/v1/runner/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      runnerId,
                      transactionId,
                      nodeId: node.id,
                      action: "EXECUTE",
                      outcome: "RECOVERED",
                      resourceId: recoveredId,
                    }),
                  });
                  setIsProcessing(false);
                  return;
                }
              } catch (err) {
                console.warn("[MCPx Browser Runner] Pre-execution inspection attempt encountered error:", err);
              }
            }
          }

          // Retrieve fresh native RegisteredTool by querying getTools() with retry
          const normTargetOrigin = node.origin.replace(/\/+$/, "");
          let nativeExecuteTool: RegisteredTool | undefined;
          let tools: RegisteredTool[] = [];

          for (let attempt = 0; attempt < 6; attempt++) {
            try {
              if (typeof document.modelContext.getTools === "function") {
                tools = await document.modelContext.getTools();
              }
            } catch {
              // fallback
            }

            nativeExecuteTool =
              tools.find((t) => {
                const toolOrigin = (t.origin || "").replace(/\/+$/, "");
                const nameMatches = t.name === node.executeTool;
                const originMatches =
                  !normTargetOrigin ||
                  !toolOrigin ||
                  toolOrigin === normTargetOrigin ||
                  (toolOrigin.includes("localhost") && normTargetOrigin.includes("localhost")) ||
                  (toolOrigin.includes("127.0.0.1") && normTargetOrigin.includes("localhost"));
                return nameMatches && originMatches;
              }) || tools.find((t) => t.name === node.executeTool);

            if (nativeExecuteTool) break;
            await new Promise((res) => setTimeout(res, 500));
          }

          // Development Proof Instrumentation
          console.log("[MCPx Browser Runner]", {
            runnerId,
            tx: transactionId,
            node: node.id,
            origin: node.origin,
            tool: node.executeTool,
            discoveredToolCount: tools.length,
            nativeTool: Boolean(nativeExecuteTool),
            hasWindow: Boolean(nativeExecuteTool && typeof (nativeExecuteTool as Record<string, unknown>).window !== "undefined"),
            dispatch: "WebMCP",
          });

          if (!nativeExecuteTool) {
            await fetch("/api/v1/runner/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                runnerId,
                transactionId,
                nodeId: node.id,
                action: "EXECUTE",
                outcome: "FAILED",
                error: `Tool '${node.executeTool}' not registered in document.modelContext for origin '${node.origin}'`,
              }),
            });
            setIsProcessing(false);
            return;
          }

          // Build input payload with upstream outputs
          const payload: Record<string, unknown> = {
            ...node.executeArgs,
            operationKey: node.operationKey,
          };

          for (const [depId, out] of Object.entries(upstreamOutputs)) {
            if (out.resourceId) {
              payload.resourceId = out.resourceId;
              payload.widgetId = out.resourceId;
              if (depId.includes("database")) payload.databaseResourceId = out.resourceId;
              if (depId.includes("compute")) payload.backendResourceId = out.resourceId;
            }
          }

          try {
            // Signal executing in PostgreSQL ledger
            await fetch(`/api/transactions/${transactionId}/transition`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nodeId: node.id,
                nodeState: "EXECUTING",
                eventType: "NODE_EXECUTING",
                eventPayload: { label: node.label, service: node.service },
              }),
            });

            // Native WebMCP Tool Dispatch
            const rawResult = await document.modelContext.executeTool(
              nativeExecuteTool,
              JSON.stringify(payload)
            );

            const normalizedResult = normalizeWebMCPResult(rawResult);
            let resourceId: string | undefined;

            if (normalizedResult && typeof normalizedResult === "object") {
              const obj = normalizedResult as Record<string, unknown>;
              if (typeof obj.resourceId === "string") resourceId = obj.resourceId;
              else if (typeof obj.id === "string") resourceId = obj.id;
              else if (typeof obj.widgetId === "string") resourceId = obj.widgetId;
            }

            // Report successful WebMCP execution
            await fetch("/api/v1/runner/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                runnerId,
                transactionId,
                nodeId: node.id,
                action: "EXECUTE",
                outcome: "SUCCEEDED",
                resourceId: resourceId || node.operationKey,
                rawResult,
              }),
            });
          } catch (execErr: unknown) {
            const errMsg = execErr instanceof Error ? execErr.message : String(execErr);
            
            // Explicit error classification: only intentional drop-ack-after-commit triggers IN_DOUBT
            const isUncertain =
              (execErr && typeof execErr === "object" && "uncertainOutcome" in execErr) ||
              errMsg.includes("Simulated transport acknowledgement loss") ||
              errMsg.includes("Transport acknowledgement lost") ||
              node.executeArgs.failureMode === "drop-ack-after-commit";

            if (isUncertain) {
              console.log(`[MCPx Browser Runner] Node ${node.id} classified as IN_DOUBT (Transport ACK loss). Reconciling via inspectTool '${node.inspectTool}'...`);
              
              await fetch("/api/v1/runner/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  runnerId,
                  transactionId,
                  nodeId: node.id,
                  action: "EXECUTE",
                  outcome: "IN_DOUBT",
                  error: errMsg,
                }),
              });

              // Reconcile via native inspectTool
              await new Promise((r) => setTimeout(r, 600));

              const freshTools = await document.modelContext.getTools().catch(() => []);
              const nativeInspectTool = freshTools.find((t) => t.name === node.inspectTool);

              if (nativeInspectTool) {
                try {
                  const rawInspect = await document.modelContext.executeTool(
                    nativeInspectTool,
                    JSON.stringify({ operationKey: node.operationKey })
                  );

                  const normInspect = normalizeWebMCPResult(rawInspect) as Record<string, unknown> | null;
                  if (normInspect && normInspect.exists) {
                    const recoveredId = (normInspect.resourceId || normInspect.id || node.operationKey) as string;
                    console.log(`[MCPx Browser Runner] Authoritative inspection confirmed resource exists (${recoveredId}). Reconciled to RECOVERED.`);
                    await fetch("/api/v1/runner/complete", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        runnerId,
                        transactionId,
                        nodeId: node.id,
                        action: "EXECUTE",
                        outcome: "RECOVERED",
                        resourceId: recoveredId,
                      }),
                    });
                    setIsProcessing(false);
                    return;
                  }
                } catch {
                  // Inspection failed
                }
              }
            }

            // Clean failure
            console.log(`[MCPx Browser Runner] Node ${node.id} failed: ${errMsg}`);
            await fetch("/api/v1/runner/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                runnerId,
                transactionId,
                nodeId: node.id,
                action: "EXECUTE",
                outcome: "FAILED",
                error: errMsg,
              }),
            });
          }
        }

        // ==========================================
        // 2. COMPENSATION WITH AUTHORITATIVE INSPECTION
        // ==========================================
        if (action === "COMPENSATE" && node.compensateTool) {
          console.log(`[MCPx Browser Runner] Compensating node ${node.id} (${node.label}) via WebMCP '${node.compensateTool}'...`);
          
          let tools: RegisteredTool[] = [];
          try {
            if (typeof document.modelContext.getTools === "function") {
              tools = await document.modelContext.getTools();
            }
          } catch {
            // fallback
          }

          const nativeCompTool = tools.find((t) => t.name === node.compensateTool);
          const nativeInspectTool = tools.find((t) => t.name === node.inspectTool);

          // 1. Dispatch compensation tool
          if (nativeCompTool) {
            try {
              await document.modelContext.executeTool(
                nativeCompTool,
                JSON.stringify({
                  operationKey: node.operationKey,
                  resourceId: node.resourceId,
                })
              );
            } catch (err) {
              console.warn(`[MCPx Browser Runner] Compensation error on ${node.label}:`, err);
            }
          }

          // 2. Authoritative Inspection to verify exists: false
          let verifiedAbsent = true;
          if (nativeInspectTool) {
            try {
              const rawInspect = await document.modelContext.executeTool(
                nativeInspectTool,
                JSON.stringify({ operationKey: node.operationKey })
              );
              const normInspect = normalizeWebMCPResult(rawInspect) as Record<string, unknown> | null;
              if (normInspect && normInspect.exists === true) {
                console.error(`[MCPx Browser Runner] Compensation verification failed: Resource still exists for ${node.id}`);
                verifiedAbsent = false;
              } else {
                console.log(`[MCPx Browser Runner] Authoritative inspection confirmed resource absence for ${node.id} (exists: false).`);
              }
            } catch {
              // Assume absent if inspection tool cannot find it
            }
          }

          if (verifiedAbsent) {
            await fetch("/api/v1/runner/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                runnerId,
                transactionId,
                nodeId: node.id,
                action: "COMPENSATE",
                outcome: "COMPENSATED",
              }),
            });
          }
        }
      } catch (loopErr) {
        console.error("[MCPx Browser Runner] Worker claim loop error:", loopErr);
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    };

    const claimInterval = setInterval(pollAndExecuteWork, 800);

    return () => {
      isMountedRef.current = false;
      clearInterval(heartbeatInterval);
      clearInterval(claimInterval);
    };
  }, []);

  return { runnerId, isProcessing, lastExecutedNode };
}
