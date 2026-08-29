"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusPill from "@/components/ui/StatusPill";
import EmptyState from "@/components/ui/EmptyState";
import DiagnosticsDrawer from "@/components/ui/DiagnosticsDrawer";

interface TransactionRow {
  id: string;
  state: string;
  scenario: string;
  created_at: string;
  updated_at: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<TransactionRow | null>(null);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      })
      .catch((err) => console.error("Failed to load transactions:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    if (statusFilter !== "ALL" && tx.state !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        tx.id.toLowerCase().includes(q) ||
        (tx.scenario && tx.scenario.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Transaction Audit History"
        description="Authoritative log of multi-service WebMCP workflows, state transitions, and compensations persisted to PostgreSQL."
        badge={`${transactions.length} recorded`}
        actions={
          <Link
            href="/app"
            className="px-4 py-2 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>+ Run Transaction</span>
          </Link>
        }
      />

      {/* 2. Status Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
          {["ALL", "COMMITTED", "COMPENSATED", "IN_DOUBT", "FAILED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${statusFilter === st
                ? "bg-white/8 text-foreground font-semibold"
                : "text-muted hover:text-foreground"
                }`}
            >
              {st}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by ID or scenario…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-65 px-3 py-1.5 rounded bg-panel border border-white/8 text-xs font-mono text-foreground placeholder-subtle focus:outline-none focus:border-white/20"
        />
      </div>

      {/* 3. Empty State */}
      {!loading && filteredTransactions.length === 0 && (
        <EmptyState
          title="No transactions found"
          description={
            statusFilter !== "ALL"
              ? `No transactions matching filter '${statusFilter}'.`
              : "No transaction records persisted in PostgreSQL yet. Execute a pipeline from the Overview dashboard."
          }
          actionText="Run reference deployment"
          actionHref="/app"
        />
      )}

      {/* 4. Dense Control Plane Transactions Table */}
      {filteredTransactions.length > 0 && (
        <div className="border border-white/8 bg-panel overflow-hidden rounded-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/8 text-subtle text-xs uppercase bg-background">
                  <th className="py-3 px-5 font-normal">Transaction ID</th>
                  <th className="py-3 px-5 font-normal">Scenario / Workflow</th>
                  <th className="py-3 px-5 font-normal">Created Timestamp</th>
                  <th className="py-3 px-5 font-normal">State</th>
                  <th className="py-3 px-5 font-normal text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-white/2 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="py-3.5 px-5 font-medium text-foreground">
                      <span className="truncate max-w-45 block">{tx.id}</span>
                    </td>
                    <td className="py-3.5 px-5 text-muted">
                      {tx.scenario || "Reference deployment"}
                    </td>
                    <td className="py-3.5 px-5 text-subtle">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusPill status={tx.state} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="text-accent-lime hover:text-foreground transition-colors text-xs font-medium"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Deep Transaction Diagnostics Drawer */}
      <DiagnosticsDrawer
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title={selectedTx ? `Transaction: ${selectedTx.id}` : "Transaction"}
        data={selectedTx}
      />
    </div>
  );
}
