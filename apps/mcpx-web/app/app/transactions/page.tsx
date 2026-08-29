"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] sm:text-[19px] font-bold tracking-tight text-[#F2F3F1] font-display">
              Transactions
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#969B9E]">
              {transactions.length} recorded
            </span>
          </div>
          <p className="text-[12.5px] text-[#969B9E] max-w-xl">
            Audit history of multi-service transactions durably persisted to PostgreSQL.
          </p>
        </div>

        <Link
          href="/app"
          className="px-4 py-2 rounded-md font-mono text-[12px] font-medium bg-[#F2F3F1] text-[#080A0B] hover:bg-white transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          Run transaction
        </Link>
      </div>

      {/* Dense Transaction Registry Table */}
      <div className="border border-white/[0.08] bg-[#0C0E0F]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[11.5px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#65696B] text-[10.5px] uppercase">
                <th className="py-3 px-4 font-normal">Transaction ID</th>
                <th className="py-3 px-4 font-normal">Scenario / Workflow</th>
                <th className="py-3 px-4 font-normal">Created</th>
                <th className="py-3 px-4 font-normal">State</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#65696B]">
                    Loading transactions…
                  </td>
                </tr>
              )}

              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#65696B]">
                    No transactions recorded yet. Run a scenario from the Overview page.
                  </td>
                </tr>
              )}

              {transactions.map((tx) => {
                let badgeStyle = "bg-white/[0.04] text-[#969B9E] border-white/[0.08]";
                if (tx.state === "COMMITTED" || tx.state === "COMPENSATED") {
                  badgeStyle = "bg-emerald-950/60 text-[#A5F36B] border-[#A5F36B]/30";
                } else if (tx.state === "AWAITING_COMPENSATION_APPROVAL" || tx.state === "IN_DOUBT") {
                  badgeStyle = "bg-amber-950/60 text-amber-300 border-amber-500/40";
                } else if (tx.state === "FAILED" || tx.state === "ABORTED") {
                  badgeStyle = "bg-rose-950/60 text-rose-300 border-rose-500/40";
                }

                return (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#F2F3F1]">{tx.id}</td>
                    <td className="py-3 px-4 text-[#969B9E]">{tx.scenario || "Reference deployment"}</td>
                    <td className="py-3 px-4 text-[#65696B]">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-[10px] border rounded ${badgeStyle}`}>
                        {tx.state}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href="/app" className="text-[#A5F36B] hover:underline">
                        Inspect in Overview →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
