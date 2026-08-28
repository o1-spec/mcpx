"use client";

import { useEffect, useState } from "react";
import { deployBackendTool, getBackendTool, deleteBackendTool } from "@/lib/tools";

interface WebMCPRegistrarProps {
  onStatusChange?: (status: {
    supported: boolean;
    registered: boolean;
    tools: string[];
    error?: string;
    errorDetails?: string;
  }) => void;
}

export default function WebMCPRegistrar({ onStatusChange }: WebMCPRegistrarProps) {
  const [status, setStatus] = useState<{
    supported: boolean;
    registered: boolean;
    tools: string[];
    error?: string;
    errorDetails?: string;
  }>({
    supported: false,
    registered: false,
    tools: ["deploy_backend", "get_backend", "delete_backend"],
  });

  const mcpxOrigin = process.env.NEXT_PUBLIC_MCPX_ORIGIN || "http://localhost:3000";

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    console.log("[compute-app] origin:", window.location.origin);

    if (!document.modelContext || typeof document.modelContext.registerTool !== "function") {
      const errorMsg = "document.modelContext is not supported in this browser context.";
      console.warn("[compute-app] " + errorMsg);
      const updated = {
        supported: false,
        registered: false,
        tools: ["deploy_backend", "get_backend", "delete_backend"],
        error: errorMsg,
      };
      setStatus(updated);
      onStatusChange?.(updated);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    async function registerAllTools() {
      try {
        const options = {
          signal: controller.signal,
          exposedTo: [mcpxOrigin],
        };

        await document.modelContext!.registerTool(deployBackendTool, options);
        console.log("[compute-app] registered", deployBackendTool.name);

        await document.modelContext!.registerTool(getBackendTool, options);
        console.log("[compute-app] registered", getBackendTool.name);

        await document.modelContext!.registerTool(deleteBackendTool, options);
        console.log("[compute-app] registered", deleteBackendTool.name);

        console.log("[compute-app] all WebMCP tools registered");

        if (isMounted) {
          const updated = {
            supported: true,
            registered: true,
            tools: ["deploy_backend", "get_backend", "delete_backend"],
          };
          setStatus(updated);
          onStatusChange?.(updated);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        const errName = (err && typeof err === "object" && "name" in err) ? String(err.name) : "Error";
        const errMsg = (err && typeof err === "object" && "message" in err) ? String(err.message) : String(err);
        const fullDetails = `${errName}: ${errMsg}`;

        console.error("[compute-app] tool registration failed:", err);

        if (isMounted) {
          const updated = {
            supported: true,
            registered: false,
            tools: ["deploy_backend", "get_backend", "delete_backend"],
            error: errMsg,
            errorDetails: fullDetails,
          };
          setStatus(updated);
          onStatusChange?.(updated);
        }
      }
    }

    registerAllTools();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [onStatusChange]);

  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        status.registered
          ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
          : status.error
          ? "border-rose-500/30 bg-rose-950/20 text-rose-300"
          : "border-amber-500/30 bg-amber-950/20 text-amber-300"
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            status.registered
              ? "bg-emerald-400 animate-pulse"
              : status.error
              ? "bg-rose-500"
              : "bg-amber-400"
          }`}
        />
        <span>
          {status.registered
            ? `WebMCP tools registered & exposed to ${mcpxOrigin}`
            : status.error
            ? `Registration error: ${status.error}`
            : status.supported
            ? "Registering WebMCP tools..."
            : "document.modelContext unavailable (Browser WebMCP flag required)"}
        </span>
      </div>
      {status.errorDetails && (
        <div className="mt-2 text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded border border-rose-500/30 font-mono break-all">
          <span className="font-bold">Error details:</span> {status.errorDetails}
        </div>
      )}
    </div>
  );
}
