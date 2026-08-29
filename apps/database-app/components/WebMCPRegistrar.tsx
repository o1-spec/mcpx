"use client";

import { useEffect, useState } from "react";
import { createDatabaseTool, getDatabaseTool, deleteDatabaseTool } from "@/lib/tools";

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
    tools: ["create_database", "get_database", "delete_database"],
  });

  const mcpxOrigin = process.env.NEXT_PUBLIC_MCPX_ORIGIN || "http://localhost:3000";

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const controller = new AbortController();
    let isMounted = true;

    async function registerAllTools() {
      if (!document.modelContext || typeof document.modelContext.registerTool !== "function") {
        const errorMsg = "document.modelContext is not supported in this browser context.";
        const updated = {
          supported: false,
          registered: false,
          tools: ["create_database", "get_database", "delete_database"],
          error: errorMsg,
        };
        if (isMounted) {
          setStatus(updated);
          onStatusChange?.(updated);
        }
        return;
      }

      try {
        const options = {
          signal: controller.signal,
          exposedTo: [mcpxOrigin],
        };

        await document.modelContext.registerTool(createDatabaseTool, options);
        await document.modelContext.registerTool(getDatabaseTool, options);
        await document.modelContext.registerTool(deleteDatabaseTool, options);

        if (isMounted) {
          const updated = {
            supported: true,
            registered: true,
            tools: ["create_database", "get_database", "delete_database"],
          };
          setStatus(updated);
          onStatusChange?.(updated);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        const errName = (err && typeof err === "object" && "name" in err) ? String(err.name) : "Error";
        const errMsg = (err && typeof err === "object" && "message" in err) ? String(err.message) : String(err);
        const fullDetails = `${errName}: ${errMsg}`;

        if (isMounted) {
          const updated = {
            supported: true,
            registered: false,
            tools: ["create_database", "get_database", "delete_database"],
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
  }, [onStatusChange, mcpxOrigin]);

  return (
    <div
      className={`p-3.5 border font-mono text-xs ${
        status.registered
          ? "border-emerald-500/30 bg-panel text-emerald-300"
          : status.error
          ? "border-rose-500/30 bg-rose-950/20 text-rose-300"
          : "border-amber-500/30 bg-amber-950/20 text-amber-300"
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        <span
          className={`h-2 w-2 rounded-full ${
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
        <div className="mt-2 text-[11px] text-rose-300 bg-background p-2.5 border border-rose-500/30 font-mono break-all">
          <span className="font-bold">Error details:</span> {status.errorDetails}
        </div>
      )}
    </div>
  );
}
