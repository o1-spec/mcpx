"use client";

import { useState, useEffect, useCallback } from "react";
import type { ConnectedServiceRecord } from "@/lib/db";
import type { RegisteredTool } from "@/types/webmcp";

export interface DiscoveredToolSchema {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export function useConnectedServices() {
  const [services, setServices] = useState<ConnectedServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServices(data.services || []);
    } catch (err: unknown) {
      console.error("[mcpx-services] fetchServices error:", err);
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setServices(data.services || []);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load services");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Browser-native discovery for a specific origin via document.modelContext
   */
  const discoverOriginTools = useCallback(
    async (origin: string): Promise<DiscoveredToolSchema[]> => {
      if (typeof document === "undefined" || !document.modelContext?.getTools) {
        throw new Error("WebMCP (document.modelContext.getTools) is not available in this browser");
      }

      console.log(`[mcpx-discovery] querying WebMCP tools for origin: ${origin}`);

      let tools: RegisteredTool[] = [];
      try {
        tools = await document.modelContext.getTools({ fromOrigins: [origin] });
      } catch {
        // Fallback to all tools and filter by origin if origin parameter isn't supported
        const allTools = await document.modelContext.getTools();
        tools = (allTools || []).filter((t: RegisteredTool) => t.origin === origin);
      }

      console.log(`[mcpx-discovery] origin ${origin} tools found:`, tools);

      return (tools || []).map((t) => ({
        name: t.name,
        description: t.description || undefined,
        inputSchema: t.inputSchema || undefined,
      }));
    },
    []
  );

  /**
   * Saves a newly connected service to Postgres
   */
  const saveService = async (params: {
    name: string;
    origin: string;
    tools: DiscoveredToolSchema[];
  }): Promise<ConnectedServiceRecord> => {
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to save service (HTTP ${res.status})`);
    }

    const data = await res.json();
    await fetchServices();
    return data.service;
  };

  /**
   * Rediscover tools for a saved service and update Postgres
   */
  const rediscoverService = async (
    id: string,
    origin: string
  ): Promise<DiscoveredToolSchema[]> => {
    const tools = await discoverOriginTools(origin);
    const res = await fetch(`/api/services/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tools }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to update service snapshot`);
    }

    await fetchServices();
    return tools;
  };

  /**
   * Removes a connected service from the MCPx registry
   */
  const removeService = async (id: string): Promise<void> => {
    const res = await fetch(`/api/services/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to delete service`);
    }

    await fetchServices();
  };

  return {
    services,
    loading,
    error,
    fetchServices,
    discoverOriginTools,
    saveService,
    rediscoverService,
    removeService,
  };
}
