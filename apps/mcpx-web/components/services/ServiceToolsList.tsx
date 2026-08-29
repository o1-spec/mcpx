"use client";

import { useState, useMemo } from "react";
import type { DiscoveredToolSchema } from "@/hooks/useConnectedServices";

interface ServiceToolsListProps {
  tools: DiscoveredToolSchema[];
  toolUsageMap: Map<string, { contractName: string; role: "EXECUTE" | "INSPECT" | "COMPENSATE" }[]>;
}

export default function ServiceToolsList({ tools, toolUsageMap }: ServiceToolsListProps) {
  const [toolSearch, setToolSearch] = useState("");
  const [expandedToolIndex, setExpandedToolIndex] = useState<number | null>(null);
  const [rawSchemaToolIndex, setRawSchemaToolIndex] = useState<number | null>(null);

  const filteredTools = useMemo(() => {
    if (!toolSearch.trim()) return tools;
    const query = toolSearch.toLowerCase().trim();
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
  }, [tools, toolSearch]);

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/6 pb-2.5">
        <div>
          <h2 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
            Discovered WebMCP Tools ({tools.length})
          </h2>
          <p className="text-xs text-subtle mt-0.5 font-sans">
            Tools currently exposed by this origin over postMessage JSON-RPC.
          </p>
        </div>

        {/* Lightweight Tool Search Filter */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search tools…"
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            className="px-2.5 py-1 rounded bg-panel border border-white/9 text-foreground placeholder-subtle font-mono text-xs focus:outline-none focus:border-white/30 w-full sm:w-44"
          />
        </div>
      </div>

      {filteredTools.length === 0 ? (
        <div className="p-6 border border-dashed border-white/8 bg-panel text-center text-subtle font-mono text-xs">
          {tools.length === 0 ? "No WebMCP tools discovered on this service." : "No tools matching your search."}
        </div>
      ) : (
        <div className="border border-white/9 bg-panel divide-y divide-white/6 font-mono text-xs overflow-hidden">
          {/* Table Header (Desktop) */}
          <div className="hidden sm:grid sm:grid-cols-12 px-4 py-2 text-xs text-subtle uppercase tracking-wider bg-background">
            <div className="col-span-4">Tool</div>
            <div className="col-span-2">Intent / Type</div>
            <div className="col-span-2">Inputs</div>
            <div className="col-span-3">Contract Mapping</div>
            <div className="col-span-1 text-right">Inspect</div>
          </div>

          {/* Table Rows */}
          {filteredTools.map((tool, idx) => {
            const isExpanded = expandedToolIndex === idx;
            const showRaw = rawSchemaToolIndex === idx;
            const usages = toolUsageMap.get(tool.name) || [];
            const props = (tool.inputSchema?.properties as Record<string, { type?: string; description?: string }>) || {};
            const propKeys = Object.keys(props);
            const requiredList = Array.isArray(tool.inputSchema?.required) ? (tool.inputSchema.required as string[]) : [];

            // Infer generic intent
            let intent = "Tool";
            if (usages.length > 0) {
              const role = usages[0].role;
              intent = role === "EXECUTE" ? "Mutation" : role === "INSPECT" ? "Inspection" : "Compensate";
            } else if (tool.name.startsWith("get_") || tool.name.startsWith("query_") || tool.name.startsWith("read_") || tool.name.startsWith("inspect_")) {
              intent = "Inspection";
            } else if (tool.name.startsWith("create_") || tool.name.startsWith("deploy_") || tool.name.startsWith("provision_") || tool.name.startsWith("delete_") || tool.name.startsWith("update_")) {
              intent = "Mutation";
            }

            return (
              <div key={tool.name} className="transition-colors hover:bg-white/1.5">
                {/* Main Row */}
                <div
                  onClick={() => setExpandedToolIndex(isExpanded ? null : idx)}
                  className="p-3.5 sm:px-4 sm:py-2.5 grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-0 cursor-pointer"
                >
                  <div className="sm:col-span-4 font-bold text-foreground flex items-center gap-1.5">
                    <span className="text-accent-lime">›</span>
                    <span>{tool.name}</span>
                  </div>

                  <div className="sm:col-span-2 text-muted text-xs font-sans">
                    {intent}
                  </div>

                  <div className="sm:col-span-2 text-subtle text-xs">
                    {propKeys.length} {propKeys.length === 1 ? "field" : "fields"}
                  </div>

                  <div className="sm:col-span-3 text-xs">
                    {usages.length > 0 ? (
                      <span className="text-emerald-400 font-sans">
                        Mapped: {usages[0].contractName}
                      </span>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </div>

                  <div className="sm:col-span-1 text-right text-xs text-muted hover:text-foreground">
                    {isExpanded ? "▾ Hide" : "▸ Inspect"}
                  </div>
                </div>

                {/* Expanded Inline Detail Drawer */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-background border-t border-white/6 space-y-4 font-sans text-xs animate-in fade-in duration-100">
                    {tool.description && (
                      <div className="space-y-1">
                        <span className="text-xs font-mono text-subtle uppercase block">Description</span>
                        <p className="text-muted leading-relaxed">{tool.description}</p>
                      </div>
                    )}

                    {/* Inputs Table */}
                    <div className="space-y-2">
                      <span className="text-xs font-mono text-subtle uppercase block">
                        Input Schema ({propKeys.length} parameters)
                      </span>
                      {propKeys.length === 0 ? (
                        <div className="text-xs text-subtle font-mono">No input parameters required.</div>
                      ) : (
                        <div className="border border-white/8 bg-panel divide-y divide-white/4 font-mono text-xs">
                          <div className="grid grid-cols-12 px-3 py-1.5 text-subtle text-xs uppercase bg-background">
                            <div className="col-span-4">Field</div>
                            <div className="col-span-3">Type</div>
                            <div className="col-span-5">Requirement</div>
                          </div>
                          {propKeys.map((k) => {
                            const prop = props[k];
                            const isReq = requiredList.includes(k);
                            return (
                              <div key={k} className="grid grid-cols-12 px-3 py-1.5 items-center">
                                <div className="col-span-4 font-bold text-foreground">{k}</div>
                                <div className="col-span-3 text-cyan-300">{prop?.type || "any"}</div>
                                <div className="col-span-5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9.5px] ${isReq ? "bg-amber-950/60 text-amber-300 border border-amber-500/30" : "text-subtle"}`}>
                                    {isReq ? "required" : "optional"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Contract Usage */}
                    <div className="space-y-1 font-mono text-xs">
                      <span className="text-xs text-subtle uppercase block font-mono">Contract Bindings</span>
                      {usages.length === 0 ? (
                        <span className="text-subtle">Not currently mapped to any reliability contract.</span>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {usages.map((u, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-panel border border-white/8 text-foreground">
                              {u.contractName} · <span className="text-accent-lime">{u.role}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Raw Schema Toggle */}
                    <div className="pt-2 border-t border-white/4">
                      <button
                        type="button"
                        onClick={() => setRawSchemaToolIndex(showRaw ? null : idx)}
                        className="text-xs font-mono text-subtle hover:text-muted transition-colors cursor-pointer"
                      >
                        {showRaw ? "▾ Hide raw JSON schema" : "▸ View raw JSON schema"}
                      </button>
                      {showRaw && tool.inputSchema && (
                        <pre className="mt-2 p-3 bg-panel border border-white/6 font-mono text-xs text-muted whitespace-pre-wrap break-all overflow-x-auto">
                          {JSON.stringify(tool.inputSchema, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
