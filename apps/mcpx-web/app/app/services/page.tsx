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
            className="px-4 py-2 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>+ Connect Service</span>
          </Link>
        }
      />

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${filterTab === "all"
                ? "bg-white/8 text-foreground font-semibold"
                : "text-muted hover:text-foreground"
              }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("custom")}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${filterTab === "custom"
                ? "bg-white/8 text-foreground font-semibold"
                : "text-muted hover:text-foreground"
              }`}
          >
            Your Services ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("reference")}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${filterTab === "reference"
                ? "bg-white/8 text-foreground font-semibold"
                : "text-muted hover:text-foreground"
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
            className="w-full sm:w-60 px-3 py-1.5 rounded bg-panel border border-white/8 text-xs font-mono text-foreground placeholder-subtle focus:outline-none focus:border-white/20"
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
        <div className="border border-white/8 bg-panel overflow-hidden rounded-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/8 text-subtle text-xs uppercase bg-background">
                  <th className="py-3 px-5 font-normal">Service Name</th>
                  <th className="py-3 px-5 font-normal">Origin & Port</th>
                  <th className="py-3 px-5 font-normal">Tools Discovered</th>
                  <th className="py-3 px-5 font-normal">Reliability Contract</th>
                  <th className="py-3 px-5 font-normal">Status</th>
                  <th className="py-3 px-5 font-normal text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-subtle">
                      Discovering connected WebMCP services…
                    </td>
                  </tr>
                )}

                {/* Custom Services */}
                {(filterTab === "all" || filterTab === "custom") &&
                  filteredCustom.map((srv) => (
                    <tr
                      key={srv.id}
                      className="hover:bg-white/2 transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="text-foreground font-bold font-sans text-xs">
                          {srv.name}
                        </div>
                        <div className="text-xs text-subtle">
                          External WebMCP Service
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-muted">{srv.origin}</td>
                      <td className="py-3.5 px-5 text-foreground">
                        <span className="px-2 py-0.5 rounded bg-white/4 border border-white/8 text-xs">
                          {srv.lastDiscoveredTools?.length || 0} tools
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-muted">
                        <StatusPill status="CONFIGURED" size="sm" />
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusPill status="CONNECTED" size="sm" />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/app/services/${srv.id}`}
                          className="text-accent-lime hover:text-foreground transition-colors text-xs font-medium"
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
                      className="hover:bg-white/2 transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="text-foreground font-bold font-sans text-xs">
                          {ref.name}
                        </div>
                        <div className="text-xs text-subtle">{ref.role}</div>
                      </td>
                      <td className="py-3.5 px-5 text-muted">
                        <span>{ref.origin}</span>
                        <span className="text-subtle ml-1.5">(:{ref.port})</span>
                      </td>
                      <td className="py-3.5 px-5 text-foreground">
                        <span className="px-2 py-0.5 rounded bg-white/4 border border-white/8 text-xs">
                          {ref.tools.length} tools
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-muted">
                        <span className="text-xs text-subtle">Built-in</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusPill status={ref.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="text-xs text-subtle">Reference</span>
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
