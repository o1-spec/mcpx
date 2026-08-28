"use client";

import { RefObject, useState } from "react";
import { origins } from "@/lib/config/origins";

interface EmbeddedServicesProps {
  databaseIframeRef: RefObject<HTMLIFrameElement | null>;
  computeIframeRef: RefObject<HTMLIFrameElement | null>;
  routingIframeRef: RefObject<HTMLIFrameElement | null>;
  frontendIframeRef: RefObject<HTMLIFrameElement | null>;
  onLoad: () => void;
}

export default function EmbeddedServices({
  databaseIframeRef,
  computeIframeRef,
  routingIframeRef,
  frontendIframeRef,
  onLoad,
}: EmbeddedServicesProps) {
  const [activeTab, setActiveTab] = useState<"all" | "database" | "compute" | "routing" | "frontend">("all");

  const services = [
    {
      id: "database",
      name: "Database Service",
      port: origins.database.includes("localhost") ? ":3002" : "Cloud",
      color: "text-emerald-400",
      ref: databaseIframeRef,
      url: origins.database,
    },
    {
      id: "compute",
      name: "Compute Service",
      port: origins.compute.includes("localhost") ? ":3003" : "Cloud",
      color: "text-indigo-400",
      ref: computeIframeRef,
      url: origins.compute,
    },
    {
      id: "routing",
      name: "Routing Service",
      port: origins.routing.includes("localhost") ? ":3001" : "Cloud",
      color: "text-cyan-400",
      ref: routingIframeRef,
      url: origins.routing,
    },
    {
      id: "frontend",
      name: "Frontend Service",
      port: origins.frontend.includes("localhost") ? ":3004" : "Cloud",
      color: "text-violet-400",
      ref: frontendIframeRef,
      url: origins.frontend,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-200">
            Embedded Microservice Resource Providers (4 Ports)
          </h3>
          <p className="text-xs text-slate-400">
            Independent WebMCP applications embedded with <code>allow=&quot;tools&quot;</code>
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeTab === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
          >
            All 4
          </button>
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id as "database" | "compute" | "routing" | "frontend")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeTab === s.id ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {s.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {services
          .filter((s) => activeTab === "all" || activeTab === s.id)
          .map((svc) => (
            <div
              key={svc.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {svc.name} <span className={svc.color}>({svc.port})</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  &lt;iframe src=&quot;{svc.url}&quot; allow=&quot;tools&quot; /&gt;
                </span>
              </div>
              <div className="w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <iframe
                  ref={svc.ref}
                  src={svc.url}
                  allow="tools"
                  onLoad={onLoad}
                  className="w-full h-85 border-0"
                  title={svc.name}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
