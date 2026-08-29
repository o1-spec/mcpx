"use client";

import { useState } from "react";
import Link from "next/link";
import { useConnectedServices } from "@/hooks/useConnectedServices";
import { origins } from "@/lib/config/origins";

const referenceServices = [
  {
    name: "Database Service",
    origin: origins.database,
    tools: ["create_database", "get_database", "delete_database"],
    role: "PostgreSQL schema resource plane",
    status: "Connected",
  },
  {
    name: "Compute Service",
    origin: origins.compute,
    tools: ["deploy_backend", "get_backend", "delete_backend"],
    role: "Backend runtime health provider",
    status: "Connected",
  },
  {
    name: "Routing Service",
    origin: origins.routing,
    tools: ["create_route", "get_route", "delete_route"],
    role: "Gateway proxy route manager",
    status: "Connected",
  },
  {
    name: "Frontend Service",
    origin: origins.frontend,
    tools: ["deploy_frontend", "get_frontend", "delete_frontend"],
    role: "Application preview host",
    status: "Connected",
  },
];

export default function ServicesPage() {
  const { services, loading } = useConnectedServices();
  const [filterTab, setFilterTab] = useState<"all" | "custom" | "reference">("all");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] sm:text-[19px] font-bold tracking-tight text-[#F2F3F1] font-display">
              Services
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#969B9E]">
              {services.length + referenceServices.length} registered
            </span>
          </div>
          <p className="text-[12.5px] text-[#969B9E] max-w-xl">
            Connect WebMCP applications that expose tools for cross-origin orchestration and reliability contracts.
          </p>
        </div>

        <Link
          href="/app/services/new"
          className="px-4 py-2 rounded-md font-mono text-[12px] font-medium bg-[#F2F3F1] text-[#080A0B] hover:bg-white transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          Connect service
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-2 font-mono text-[11.5px]">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            filterTab === "all"
              ? "bg-white/[0.08] text-[#F2F3F1] font-semibold"
              : "text-[#969B9E] hover:text-[#F2F3F1]"
          }`}
        >
          All ({services.length + referenceServices.length})
        </button>
        <button
          onClick={() => setFilterTab("custom")}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            filterTab === "custom"
              ? "bg-white/[0.08] text-[#F2F3F1] font-semibold"
              : "text-[#969B9E] hover:text-[#F2F3F1]"
          }`}
        >
          Your services ({services.length})
        </button>
        <button
          onClick={() => setFilterTab("reference")}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            filterTab === "reference"
              ? "bg-white/[0.08] text-[#F2F3F1] font-semibold"
              : "text-[#969B9E] hover:text-[#F2F3F1]"
          }`}
        >
          Reference services ({referenceServices.length})
        </button>
      </div>

      {/* Dense Service Registry Table */}
      <div className="border border-white/[0.08] bg-[#0C0E0F]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[11.5px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#65696B] text-[10.5px] uppercase">
                <th className="py-3 px-4 font-normal">Service</th>
                <th className="py-3 px-4 font-normal">Origin</th>
                <th className="py-3 px-4 font-normal">Tools</th>
                <th className="py-3 px-4 font-normal">Contracts</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#65696B]">
                    Loading connected services…
                  </td>
                </tr>
              )}

              {/* Your Connected Services */}
              {(filterTab === "all" || filterTab === "custom") &&
                services.map((srv) => (
                  <tr key={srv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-[#F2F3F1] font-semibold">{srv.name}</div>
                      <div className="text-[10px] text-[#65696B]">Custom WebMCP</div>
                    </td>
                    <td className="py-3 px-4 text-[#969B9E]">{srv.origin}</td>
                    <td className="py-3 px-4 text-[#F2F3F1]">
                      {srv.lastDiscoveredTools?.length || 0} discovered
                    </td>
                    <td className="py-3 px-4 text-[#65696B]">Configured</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[#A5F36B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A5F36B]"></span>
                        <span>Connected</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/app/services/${srv.id}`}
                        className="text-[#A5F36B] hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}

              {/* Reference Services */}
              {(filterTab === "all" || filterTab === "reference") &&
                referenceServices.map((ref) => (
                  <tr key={ref.origin} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-[#F2F3F1] font-semibold">{ref.name}</div>
                      <div className="text-[10px] text-[#65696B]">{ref.role}</div>
                    </td>
                    <td className="py-3 px-4 text-[#969B9E]">{ref.origin}</td>
                    <td className="py-3 px-4 text-[#F2F3F1]">{ref.tools.length} discovered</td>
                    <td className="py-3 px-4 text-[#969B9E]">Pre-configured</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[#A5F36B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A5F36B]"></span>
                        <span>{ref.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#65696B]">
                      <span>Reference</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
