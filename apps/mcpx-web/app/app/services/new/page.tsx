"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/services/AppNav";
import WebMCPServiceFrame from "@/components/services/WebMCPServiceFrame";
import { useConnectedServices, type DiscoveredToolSchema } from "@/hooks/useConnectedServices";

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
  const [showHelp, setShowHelp] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        <AppNav />

        {/* Dynamic Off-Screen WebMCP Host Frame */}
        {normalizedOrigin && (
          <WebMCPServiceFrame origin={normalizedOrigin} onLoad={handleIframeLoaded} />
        )}

        {/* Header */}
        <div className="space-y-1 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-2">
            <Link
              href="/app/services"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Services
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans">
            Connect WebMCP service
          </h1>
          <p className="text-xs text-slate-400">
            Connect an external web application to discover its exposed WebMCP capabilities.
          </p>
        </div>

        {/* Connection Form */}
        <form onSubmit={handleConnect} className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="origin-url" className="text-xs font-medium text-slate-300 block">
                Origin URL <span className="text-indigo-400">*</span>
              </label>
              <input
                id="origin-url"
                type="text"
                placeholder="http://localhost:3010 or https://billing.example.com"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                disabled={phase === "connecting" || phase === "discovering"}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 font-sans block">
                The browser origin hosting your WebMCP application.
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="service-name" className="text-xs font-medium text-slate-300 block">
                Service name <span className="text-slate-500 text-[11px]">(optional)</span>
              </label>
              <input
                id="service-name"
                type="text"
                placeholder="e.g. Billing Service or Notification Engine"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                disabled={phase === "connecting" || phase === "discovering"}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-sans text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={phase === "connecting" || phase === "discovering" || !originInput.trim()}
              className="px-5 py-2.5 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {phase === "connecting" || phase === "discovering" ? "Connecting…" : "Connect"}
            </button>

            {phase !== "idle" && (
              <button
                type="button"
                onClick={() => {
                  setPhase("idle");
                  setNormalizedOrigin(null);
                  setStatusMessage(null);
                  setDiscoveredTools([]);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* Discovery Results & State Card */}
        {phase !== "idle" && (
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    phase === "connected"
                      ? "bg-emerald-400"
                      : phase === "failed" || phase === "no_tools"
                      ? "bg-rose-400"
                      : "bg-indigo-400 animate-pulse"
                  }`}
                ></span>
                <span className="text-xs font-medium text-white">
                  {phase === "connecting" && "Connecting to application…"}
                  {phase === "loaded" && "Application loaded"}
                  {phase === "discovering" && "Discovering WebMCP tools…"}
                  {phase === "connected" && "Connected"}
                  {phase === "no_tools" && "No tools exposed"}
                  {phase === "failed" && "Connection failed"}
                </span>
              </div>

              {normalizedOrigin && (
                <span className="text-[11px] font-mono text-slate-500">
                  {normalizedOrigin}
                </span>
              )}
            </div>

            {statusMessage && (
              <p
                className={`text-xs ${
                  phase === "failed" || phase === "no_tools"
                    ? "text-rose-400"
                    : "text-slate-400"
                }`}
              >
                {statusMessage}
              </p>
            )}

            {/* Discovered Tools List */}
            {discoveredTools.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Discovered tools ({discoveredTools.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Reliability contract: Not configured
                  </span>
                </div>

                <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                  {discoveredTools.map((tool, idx) => (
                    <div key={tool.name} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono font-medium text-emerald-400 block">
                            {tool.name}
                          </span>
                          {tool.description && (
                            <p className="text-xs text-slate-400 font-sans">
                              {tool.description}
                            </p>
                          )}
                        </div>

                        {tool.inputSchema && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSchemaIndex(expandedSchemaIndex === idx ? null : idx)
                            }
                            className="text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                          >
                            {expandedSchemaIndex === idx ? "▾ schema" : "▸ schema"}
                          </button>
                        )}
                      </div>

                      {expandedSchemaIndex === idx && tool.inputSchema && (
                        <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all">
                          {JSON.stringify(tool.inputSchema, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>

                {/* Save Service CTA */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Saves service to your MCPx registry.
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-lg font-medium text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? "Saving…" : "Save service"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compatibility Info Box */}
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/20 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-300">
              WebMCP service requirements
            </span>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              {showHelp ? "Hide explanation" : "Learn what a compatible service needs"}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Your application must expose tools via <code className="text-slate-300 font-mono">document.modelContext.registerTool</code> and allow MCPx (<code className="text-slate-300 font-mono">http://localhost:3000</code>) to access them.
          </p>

          {showHelp && (
            <div className="pt-2 border-t border-slate-800/60 space-y-2 text-[11px] text-slate-400 animate-in fade-in duration-150">
              <p>
                1. <strong>Browser-native discovery:</strong> MCPx loads the application via an embedded frame with <code className="text-slate-300 font-mono">allow=&quot;tools&quot;</code>.
              </p>
              <p>
                2. <strong>Tool registration:</strong> The application declares capabilities with schemas that agents can discover.
              </p>
              <p>
                3. <strong>Zero mutations during onboarding:</strong> MCPx only queries metadata during connection; tools are not executed until added to a workflow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
