"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkflowRecord } from "@/lib/db";

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/workflows");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (err: unknown) {
      console.error("[mcpx-workflows] fetchWorkflows error:", err);
      setError(err instanceof Error ? err.message : "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createNewWorkflow = async (params: {
    name: string;
    description?: string;
    nodes: Array<{
      stepKey: string;
      label: string;
      contractId: string;
      dependencies: string[];
      inputConfig?: Record<string, { type: "static" | "dependency_output"; value?: unknown; stepId?: string; field?: string }>;
    }>;
  }): Promise<WorkflowRecord> => {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to create workflow (HTTP ${res.status})`);
    }

    const data = await res.json();
    await fetchWorkflows();
    return data.workflow;
  };

  const removeWorkflow = async (id: string): Promise<void> => {
    const res = await fetch(`/api/workflows/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to delete workflow`);
    }

    await fetchWorkflows();
  };

  return {
    workflows,
    loading,
    error,
    fetchWorkflows,
    createNewWorkflow,
    removeWorkflow,
  };
}
