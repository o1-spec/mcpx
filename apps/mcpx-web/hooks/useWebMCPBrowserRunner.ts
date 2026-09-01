"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeWebMCPResult } from "@/lib/webmcp-utils";
import type { RegisteredTool } from "@/types/webmcp";

interface ClaimedWork {
  transactionId: string;
  action: "EXECUTE" | "COMPENSATE";
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
    executeArgs: Record<string, unknown>;
  };
  upstreamOutputs?: Record<string, { resourceId?: string; [key: string]: unknown }>;
}

export function useWebMCPBrowserRunner() {
  const [runnerId] = useState(() => `runner_${Math.random().toString(36).slice(2, 10)}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastExecutedNode, setLastExecutedNode] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Heartbeat loop (every 5 seconds)
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/v1/runner/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runnerId,
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

    // 2. Work Claim & WebMCP Execution Loop (every 1 second)
    const pollAndExecuteWork = async () => {
      if (!isMountedRef.current || isProcessing) return;

      try {
        const claimRes = await fetch("/api/v1/runner/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runnerId }),
        });

        if (!claimRes.ok) return;
        const claimData = await claimRes.json();
        const work: ClaimedWork | null = claimData.work;

        if (!work || !work.node) return;

        setIsProcessing(true);
        setLastExecutedNode(`${work.action}: ${work.node.label}`);

        const { transactionId, action, node, upstreamOutputs = {} } = work;

        // Check native document.modelContext availability
        if (typeof document === "undefined" || !document.modelContext) {
          await fetch("/api/v1/runner/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              runnerId,
              transactionId,
              nodeId: node.id,
              action,
              outcome: "FAILED",
              error: "document.modelContext unavailable in active browser window",
            }),
          });
          setIsProcessing(false);
          return;
        }

        // ==========================================
        // FORWARD EXECUTION via NATIVE WebMCP
        // ==========================================
        if (action === "EXECUTE") {
          // 1. Retrieve fresh native RegisteredTool by querying getTools()
          let tools: RegisteredTool[] = [];
          try {
            if (typeof document.modelContext.getTools === "function") {
              tools = await document.modelContext.getTools();
            }
          } catch {
            // fallback
          }

          const nativeExecuteTool = tools.find(
            (t) => t.name === node.executeTool && (!node.origin || t.origin === node.origin || t.origin?.includes("localhost"))
          ) || tools.find((t) => t.name === node.executeTool);

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
            // Signal executing
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
            const isUncertain =
              (execErr && typeof execErr === "object" && "uncertainOutcome" in execErr) ||
              errMsg.includes("Simulated transport acknowledgement loss") ||
              errMsg.includes("Transport acknowledgement lost") ||
              node.executeArgs.failureMode === "drop-ack-after-commit";

            if (isUncertain) {
              // Report IN_DOUBT
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
        // COMPENSATION EXECUTION via NATIVE WebMCP
        // ==========================================
        if (action === "COMPENSATE" && node.compensateTool) {
          let tools: RegisteredTool[] = [];
          try {
            if (typeof document.modelContext.getTools === "function") {
              tools = await document.modelContext.getTools();
            }
          } catch {
            // fallback
          }

          const nativeCompTool = tools.find((t) => t.name === node.compensateTool);

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
              console.warn(`[WebMCP-Runner] Compensation error on ${node.label}:`, err);
            }
          }

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
      } catch (loopErr) {
        console.error("[WebMCP-Runner] Worker claim loop error:", loopErr);
      } finally {
        setIsProcessing(false);
      }
    };

    const claimInterval = setInterval(pollAndExecuteWork, 800);

    return () => {
      isMountedRef.current = false;
      clearInterval(heartbeatInterval);
      clearInterval(claimInterval);
    };
  }, [runnerId, isProcessing]);

  return { runnerId, isProcessing, lastExecutedNode };
}
