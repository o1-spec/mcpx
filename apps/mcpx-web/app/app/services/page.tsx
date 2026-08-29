"use client";

import { useState } from "react";
import Link from "next/link";
import { useConnectedServices } from "@/hooks/useConnectedServices";
import { origins } from "@/lib/config/origins";
import PageHeader from "@/components/ui/PageHeader";
import StatusPill from "@/components/ui/StatusPill";
import EmptyState from "@/components/ui/EmptyState";

const referenceServices = [
  {
    name: "Database Service",
    origin: origins.database,
    tools: ["create_database", "get_database", "delete_database"],
    role: "PostgreSQL schema resource plane",
    status: "CONNECTED",
    port: "3002",
  },
  {
    name: "Compute Service",
    origin: origins.compute,
    tools: ["deploy_backend", "get_backend", "delete_backend"],
    role: "Backend runtime health provider",
    status: "CONNECTED",
    port: "3003",
  },
  {
    name: "Routing Service",
    origin: origins.routing,
    tools: ["create_route", "get_route", "delete_route"],
    role: "Gateway proxy route manager",
    status: "CONNECTED",
    port: "3001",
  },
  {
    name: "Frontend Service",
    origin: origins.frontend,
    tools: ["deploy_frontend", "get_frontend", "delete_frontend"],
    role: "Application preview host",
    status: "CONNECTED",
    port: "3004",
  },
];

export default function ServicesPage() {
  const { services, loading } = useConnectedServices();
  const [filterTab, setFilterTab] = useState<"all" | "custom" | "reference">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalCount = services.length + referenceServices.length;

  const filteredCustom = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRef = referenceServices.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.origin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Services Registry"
        description="Register and inspect WebMCP-enabled microservices and applications exposing tools across browser origins."
        badge={`${totalCount} registered`}
        actions={
          <Link
            href="/app/services/new"
            className="px-4 py-2 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[12.5px] font-sans transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>+ Connect Service</span>
          </Link>
        }
      />

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-1 font-mono text-[12px]">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              filterTab === "all"
                ? "bg-white/[0.08] text-[#F5F5F3] font-semibold"
                : "text-[#A0A0A4] hover:text-[#F5F5F3]"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("custom")}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              filterTab === "custom"
                ? "bg-white/[0.08] text-[#F5F5F3] font-semibold"
                : "text-[#A0A0A4] hover:text-[#F5F5F3]"
            }`}
          >
            Your Services ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("reference")}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              filterTab === "reference"
                ? "bg-white/[0.08] text-[#F5F5F3] font-semibold"
                : "text-[#A0A0A4] hover:text-[#F5F5F3]"
            }`}
          >
            Reference Services ({referenceServices.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Filter by name or origin…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[240px] px-3 py-1.5 rounded bg-[#0B0C0E] border border-white/[0.08] text-[12px] font-mono text-[#F5F5F3] placeholder-[#66686D] focus:outline-none focus:border-white/20"
          />
        </div>
      </div>

      {/* 3. Empty State for Custom Services */}
      {filterTab === "custom" && services.length === 0 && !loading && (
        <EmptyState
          title="No custom services connected"
          description="Connect your external WebMCP microservice to automatically discover exposed tools and define reliability contracts."
          actionText="Connect your first service"
          actionHref="/app/services/new"
        />
      )}

      {/* 4. Dense Control Plane Services Table */}
      {(filterTab !== "custom" || services.length > 0) && (
        <div className="border border-white/[0.08] bg-[#0B0C0E] overflow-hidden rounded-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[12px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#66686D] text-[10.5px] uppercase bg-[#070708]">
                  <th className="py-3 px-5 font-normal">Service Name</th>
                  <th className="py-3 px-5 font-normal">Origin & Port</th>
                  <th className="py-3 px-5 font-normal">Tools Discovered</th>
                  <th className="py-3 px-5 font-normal">Reliability Contract</th>
                  <th className="py-3 px-5 font-normal">Status</th>
                  <th className="py-3 px-5 font-normal text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#66686D]">
                      Discovering connected WebMCP services…
                    </td>
                  </tr>
                )}

                {/* Custom Services */}
                {(filterTab === "all" || filterTab === "custom") &&
                  filteredCustom.map((srv) => (
                    <tr
                      key={srv.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="text-[#F5F5F3] font-bold font-sans text-[13px]">
                          {srv.name}
                        </div>
                        <div className="text-[10.5px] text-[#66686D]">
                          External WebMCP Service
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-[#A0A0A4]">{srv.origin}</td>
                      <td className="py-3.5 px-5 text-[#F5F5F3]">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px]">
                          {srv.lastDiscoveredTools?.length || 0} tools
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-[#A0A0A4]">
                        <StatusPill status="CONFIGURED" size="sm" />
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusPill status="CONNECTED" size="sm" />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/app/services/${srv.id}`}
                          className="text-[#A5F36B] hover:text-white transition-colors text-[12px] font-medium"
                        >
                          Inspect →
                        </Link>
                      </td>
                    </tr>
                  ))}

                {/* Reference Services */}
                {(filterTab === "all" || filterTab === "reference") &&
                  filteredRef.map((ref) => (
                    <tr
                      key={ref.origin}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="text-[#F5F5F3] font-bold font-sans text-[13px]">
                          {ref.name}
                        </div>
                        <div className="text-[10.5px] text-[#66686D]">{ref.role}</div>
                      </td>
                      <td className="py-3.5 px-5 text-[#A0A0A4]">
                        <span>{ref.origin}</span>
                        <span className="text-[#66686D] ml-1.5">(:{ref.port})</span>
                      </td>
                      <td className="py-3.5 px-5 text-[#F5F5F3]">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px]">
                          {ref.tools.length} tools
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-[#A0A0A4]">
                        <span className="text-[11px] text-[#66686D]">Built-in</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusPill status={ref.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="text-[11.5px] text-[#66686D]">Reference</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
