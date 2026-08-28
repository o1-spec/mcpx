"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReliabilityContractRecord } from "@/lib/db";

export function useReliabilityContracts(serviceId: string) {
  const [contracts, setContracts] = useState<ReliabilityContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    if (!serviceId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/services/${encodeURIComponent(serviceId)}/contracts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (err: unknown) {
      console.error("[mcpx-contracts] fetchContracts error:", err);
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const createContract = async (params: {
    name: string;
    executeToolName: string;
    inspectToolName: string;
    compensateToolName?: string | null;
    operationKeyField: string;
    assertions: {
      executeIdempotent?: boolean;
      inspectAuthoritative?: boolean;
      compensateRetrySafe?: boolean;
    };
    executeSchemaSnapshot?: Record<string, unknown> | null;
    inspectSchemaSnapshot?: Record<string, unknown> | null;
    compensateSchemaSnapshot?: Record<string, unknown> | null;
  }): Promise<ReliabilityContractRecord> => {
    const res = await fetch(`/api/services/${encodeURIComponent(serviceId)}/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to create contract (HTTP ${res.status})`);
    }

    const data = await res.json();
    await fetchContracts();
    return data.contract;
  };

  const deleteContract = async (contractId: string): Promise<void> => {
    const res = await fetch(
      `/api/services/${encodeURIComponent(serviceId)}/contracts/${encodeURIComponent(contractId)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to delete contract`);
    }

    await fetchContracts();
  };

  return {
    contracts,
    loading,
    error,
    fetchContracts,
    createContract,
    deleteContract,
  };
}
