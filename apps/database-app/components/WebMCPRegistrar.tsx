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

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    console.log("[database-app] origin:", window.location.origin);
    console.log("[database-app] document.modelContext:", document.modelContext);

    if (!document.modelContext || typeof document.modelContext.registerTool !== "function") {
      const errorMsg = "document.modelContext is not supported in this browser context.";
      console.warn("[database-app] " + errorMsg);
      const updated = {
        supported: false,
        registered: false,
        tools: ["create_database", "get_database", "delete_database"],
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
          exposedTo: ["http://localhost:3000"],
        };

        await document.modelContext!.registerTool(createDatabaseTool, options);
        console.log("[database-app] registered", createDatabaseTool.name);

        await document.modelContext!.registerTool(getDatabaseTool, options);
        console.log("[database-app] registered", getDatabaseTool.name);

        await document.modelContext!.registerTool(deleteDatabaseTool, options);
        console.log("[database-app] registered", deleteDatabaseTool.name);

        console.log("[database-app] all WebMCP tools registered");

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
        if (controller.signal.aborted) {
          console.log("[database-app] registration aborted on unmount");
          return;
        }

        const errName = (err && typeof err === "object" && "name" in err) ? String(err.name) : "Error";
        const errMsg = (err && typeof err === "object" && "message" in err) ? String(err.message) : String(err);
        const fullDetails = `${errName}: ${errMsg}`;

        console.error("[database-app] tool registration failed:", err);

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
      console.log("[database-app] aborted tool registrations (unmount)");
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
            ? "WebMCP tools registered & exposed to http://localhost:3000"
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
