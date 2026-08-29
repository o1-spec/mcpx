"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WebMCPServiceFrame from "@/components/services/WebMCPServiceFrame";
import { useConnectedServices, type DiscoveredToolSchema } from "@/hooks/useConnectedServices";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatusPill from "@/components/ui/StatusPill";

type ConnectionPhase =
  | "idle"
  | "connecting"
  | "loaded"
  | "discovering"
  | "connected"
  | "no_tools"
  | "failed";

export default function NewServicePage() {
  const router = useRouter();
  const { discoverOriginTools, saveService } = useConnectedServices();

  const [originInput, setOriginInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [normalizedOrigin, setNormalizedOrigin] = useState<string | null>(null);
  const [phase, setPhase] = useState<ConnectionPhase>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [discoveredTools, setDiscoveredTools] = useState<DiscoveredToolSchema[]>([]);
  const [expandedSchemaIndex, setExpandedSchemaIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setDiscoveredTools([]);

    const trimmed = originInput.trim();
    if (!trimmed) {
      setPhase("failed");
      setStatusMessage("Enter a valid HTTP or HTTPS origin URL.");
      return;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setPhase("failed");
        setStatusMessage("Enter a valid HTTP or HTTPS origin (e.g. http://localhost:3010 or https://billing.example.com).");
        return;
      }
      const origin = parsed.origin;
      setNormalizedOrigin(origin);
      setPhase("connecting");
      setStatusMessage("Loading application in WebMCP host frame…");
    } catch {
      setPhase("failed");
      setStatusMessage("Invalid URL format. Please check the origin address.");
    }
  };

  const handleIframeLoaded = async () => {
    if (!normalizedOrigin) return;

    setPhase("loaded");
    setStatusMessage("Application loaded. Discovering WebMCP tools…");

    // Brief delay to allow child app's WebMCP registrar to complete tool registration
    setTimeout(async () => {
      try {
        setPhase("discovering");
        const tools = await discoverOriginTools(normalizedOrigin);

        if (tools.length === 0) {
          setPhase("no_tools");
          setStatusMessage("Application loaded, but no WebMCP tools were exposed to MCPx.");
        } else {
          setDiscoveredTools(tools);
          setPhase("connected");
          setStatusMessage(`${tools.length} WebMCP tool${tools.length > 1 ? "s" : ""} discovered.`);
        }
      } catch (err: unknown) {
        console.error("[mcpx-new] discovery error:", err);
        setPhase("failed");
        const msg = err instanceof Error ? err.message : String(err);
        setStatusMessage(`Could not access WebMCP tools: ${msg}`);
      }
    }, 600);
  };

  const handleSave = async () => {
    if (!normalizedOrigin || discoveredTools.length === 0) return;

    try {
      setIsSaving(true);
      const serviceName = nameInput.trim() || new URL(normalizedOrigin).hostname || "Connected Service";
      await saveService({
        name: serviceName,
        origin: normalizedOrigin,
        tools: discoveredTools,
      });
      router.push("/app/services");
    } catch (err: unknown) {
      console.error("[mcpx-new] save error:", err);
      setIsSaving(false);
      setStatusMessage(err instanceof Error ? err.message : "Failed to save service");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Dynamic Off-Screen WebMCP Host Frame */}
      {normalizedOrigin && (
        <WebMCPServiceFrame origin={normalizedOrigin} onLoad={handleIframeLoaded} />
      )}

      {/* Page Header */}
      <PageHeader
        title="Connect WebMCP Service"
        description="Connect an external web application or microservice to inspect its tools and configure reliability contracts."
        breadcrumbs={[
          { label: "Services", href: "/app/services" },
          { label: "Connect Service" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form (~60%) */}
        <div className="lg:col-span-7 space-y-6">
          <Panel title="SERVICE ORIGIN & IDENTITY">
            <form onSubmit={handleConnect} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label htmlFor="origin-url" className="text-xs text-subtle uppercase block">
                  Origin URL <span className="text-accent-lime">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="origin-url"
                    type="text"
                    placeholder="http://localhost:3010 or https://app.example.com"
                    value={originInput}
                    onChange={(e) => setOriginInput(e.target.value)}
                    disabled={phase === "connecting" || phase === "discovering"}
                    className="flex-1 px-3.5 py-2 rounded bg-background border border-white/8 text-xs font-mono text-foreground placeholder-subtle focus:outline-none focus:border-white/25"
                    required
                  />
                  <button
                    type="submit"
                    disabled={phase === "connecting" || phase === "discovering"}
                    className="px-4 py-2 rounded bg-foreground text-background hover:bg-white font-sans font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {phase === "connecting" || phase === "discovering" ? "Connecting…" : "Discover Tools →"}
                  </button>
                </div>
                <p className="text-xs text-subtle">
                  Must be a reachable URL serving WebMCP tools via <code className="text-muted">document.modelContext</code>.
                </p>
              </div>

              {phase !== "idle" && (
                <div className="space-y-1.5 pt-2">
                  <label htmlFor="service-name" className="text-xs text-subtle uppercase block">
                    Service Name (Optional)
                  </label>
                  <input
                    id="service-name"
                    type="text"
                    placeholder="e.g. Billing Service"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded bg-background border border-white/8 text-xs font-mono text-foreground placeholder-subtle focus:outline-none focus:border-white/25"
                  />
                </div>
              )}
            </form>
          </Panel>

          {/* Discovery Status Message */}
          {statusMessage && (
            <div
              className={`p-4 border font-mono text-xs rounded ${phase === "connected"
                  ? "bg-emerald-950/30 border-accent-lime/30 text-accent-lime"
                  : phase === "failed" || phase === "no_tools"
                    ? "bg-rose-950/30 border-rose-500/30 text-rose-300"
                    : "bg-cyan-950/30 border-cyan-500/30 text-cyan-300"
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase">[{phase}]</span>
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {/* Discovered Tools List */}
          {discoveredTools.length > 0 && (
            <Panel
              title="DISCOVERED WEBMCP TOOLS"
              badge={
                <span className="text-xs font-mono text-accent-lime">
                  {discoveredTools.length} found
                </span>
              }
            >
              <div className="space-y-3 font-mono text-xs">
                {discoveredTools.map((tool, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-background border border-white/6 rounded space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
                        <span className="text-foreground font-bold">{tool.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSchemaIndex(expandedSchemaIndex === idx ? null : idx)
                        }
                        className="text-xs text-subtle hover:text-foreground"
                      >
                        {expandedSchemaIndex === idx ? "Hide Schema" : "View Schema"}
                      </button>
                    </div>

                    {tool.description && (
                      <p className="text-xs text-muted font-sans">
                        {tool.description}
                      </p>
                    )}

                    {expandedSchemaIndex === idx && tool.inputSchema && (
                      <pre className="p-2.5 bg-panel border border-white/4 rounded text-xs text-muted overflow-x-auto">
                        {JSON.stringify(tool.inputSchema, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 rounded bg-accent-lime text-background hover:bg-accent-lime/90 font-sans font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm mt-4 flex items-center justify-center gap-2"
                >
                  {isSaving ? "Saving Service…" : "Save Service & Register Tools →"}
                </button>
              </div>
            </Panel>
          )}
        </div>

        {/* Right Column: Guidance Rail (~40%) */}
        <div className="lg:col-span-5 space-y-6">
          <Panel title="WEBMCP DISCOVERY PROTOCOL">
            <div className="space-y-3 text-xs text-muted font-sans leading-relaxed">
              <p>
                MCPx connects to WebMCP services via secure iframe bridge, querying{" "}
                <code className="font-mono text-foreground text-xs">document.modelContext.listTools()</code>.
              </p>
              <div className="p-3 bg-background border border-white/6 rounded font-mono text-xs space-y-1 text-subtle">
                <div>1. Service loads in host bridge</div>
                <div>2. Tools enumerate across boundary</div>
                <div>3. Reliability contracts bind to tools</div>
              </div>
            </div>
          </Panel>

          <Panel title="EXAMPLE LOCAL FIXTURE">
            <div className="space-y-2 text-xs font-mono text-muted">
              <p className="text-xs text-subtle font-sans">
                You can connect the built-in generic external service fixture:
              </p>
              <div className="p-2.5 bg-background border border-white/6 rounded text-accent-lime flex items-center justify-between">
                <span>http://localhost:3010</span>
                <button
                  type="button"
                  onClick={() => setOriginInput("http://localhost:3010")}
                  className="text-foreground hover:underline text-xs"
                >
                  Use URL
                </button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
