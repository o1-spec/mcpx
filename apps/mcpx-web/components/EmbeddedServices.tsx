"use client";

import { RefObject } from "react";

interface EmbeddedServicesProps {
  routingIframeRef: RefObject<HTMLIFrameElement | null>;
  databaseIframeRef: RefObject<HTMLIFrameElement | null>;
  onLoad: () => void;
}

export default function EmbeddedServices({
  routingIframeRef,
  databaseIframeRef,
  onLoad,
}: EmbeddedServicesProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-200">
          Embedded WebMCP Resource Providers
        </h3>
        <p className="text-xs text-slate-400">
          Live cross-origin services running independently on ports 3001 and 3002
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Routing Service Iframe */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Routing Service (:3001)
            </h4>
            <span className="text-[11px] font-mono text-cyan-400">
              &lt;iframe src=&quot;http://localhost:3001&quot; allow=&quot;tools&quot; /&gt;
            </span>
          </div>
          <div className="w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <iframe
              ref={routingIframeRef}
              src="http://localhost:3001"
              allow="tools"
              onLoad={onLoad}
              className="w-full h-[380px] border-0"
              title="Cross-Origin Routing Application"
            />
          </div>
        </div>

        {/* Database Service Iframe */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Database Service (:3002)
            </h4>
            <span className="text-[11px] font-mono text-emerald-400">
              &lt;iframe src=&quot;http://localhost:3002&quot; allow=&quot;tools&quot; /&gt;
            </span>
          </div>
          <div className="w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <iframe
              ref={databaseIframeRef}
              src="http://localhost:3002"
              allow="tools"
              onLoad={onLoad}
              className="w-full h-[380px] border-0"
              title="Cross-Origin Database Application"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
