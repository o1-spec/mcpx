"use client";

import { useEffect, useState } from "react";
import {
  pingServiceTool,
  getStatusTool,
  createWidgetTool,
  getWidgetTool,
  deleteWidgetTool,
  publishWidgetTool,
  getPublicationTool,
  unpublishWidgetTool,
  sendNotificationTool,
} from "@/lib/tools";

interface WebMCPRegistrarProps {
  onStatusChange?: (status: {
    supported: boolean;
    registered: boolean;
    tools: string[];
    error?: string;
  }) => void;
}

export default function WebMCPRegistrar({ onStatusChange }: WebMCPRegistrarProps) {
  const [status, setStatus] = useState<{
    supported: boolean;
    registered: boolean;
    tools: string[];
    error?: string;
  }>({
    supported: false,
    registered: false,
    tools: [
      "ping_service",
      "get_status",
      "create_widget",
      "get_widget",
      "delete_widget",
      "publish_widget",
      "get_publication",
      "unpublish_widget",
      "send_notification",
    ],
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    if (!document.modelContext || typeof document.modelContext.registerTool !== "function") {
      const updated = {
        supported: false,
        registered: false,
        tools: [
          "ping_service",
          "get_status",
          "create_widget",
          "get_widget",
          "delete_widget",
          "publish_widget",
          "get_publication",
          "unpublish_widget",
          "send_notification",
        ],
        error: "document.modelContext unavailable in this context",
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

        await document.modelContext!.registerTool(pingServiceTool, options);
        await document.modelContext!.registerTool(getStatusTool, options);
        await document.modelContext!.registerTool(createWidgetTool, options);
        await document.modelContext!.registerTool(getWidgetTool, options);
        await document.modelContext!.registerTool(deleteWidgetTool, options);
        await document.modelContext!.registerTool(publishWidgetTool, options);
        await document.modelContext!.registerTool(getPublicationTool, options);
        await document.modelContext!.registerTool(unpublishWidgetTool, options);
        await document.modelContext!.registerTool(sendNotificationTool, options);

        if (isMounted) {
          const updated = {
            supported: true,
            registered: true,
            tools: [
              "ping_service",
              "get_status",
              "create_widget",
              "get_widget",
              "delete_widget",
              "publish_widget",
              "get_publication",
              "unpublish_widget",
              "send_notification",
            ],
          };
          setStatus(updated);
          onStatusChange?.(updated);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const errMsg = err instanceof Error ? err.message : String(err);
        if (isMounted) {
          const updated = {
            supported: true,
            registered: false,
            tools: [
              "ping_service",
              "get_status",
              "create_widget",
              "get_widget",
              "delete_widget",
              "publish_widget",
              "get_publication",
              "unpublish_widget",
              "send_notification",
            ],
            error: errMsg,
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
      className={`rounded-xl border p-4 text-xs ${
        status.registered
          ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
          : status.error
          ? "border-rose-500/30 bg-rose-950/20 text-rose-300"
          : "border-amber-500/30 bg-amber-950/20 text-amber-300"
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        <span
          className={`h-2 w-2 rounded-full ${
            status.registered ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
          }`}
        />
        <span>
          {status.registered
            ? "WebMCP tools registered & exposed to http://localhost:3000"
            : status.error || "Registering WebMCP tools…"}
        </span>
      </div>
    </div>
  );
}
