"use client";

import { RefObject } from "react";

interface EmbeddedRoutingIframeProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onLoad: () => void;
}

export default function EmbeddedRoutingIframe({
  iframeRef,
  onLoad,
}: EmbeddedRoutingIframeProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Embedded Routing Application
        </h3>
        <span className="text-xs font-mono text-cyan-400">
          &lt;iframe src=&quot;http://localhost:3001&quot; allow=&quot;tools&quot; /&gt;
        </span>
      </div>
      <div className="w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
        <iframe
          ref={iframeRef}
          src="http://localhost:3001"
          allow="tools"
          onLoad={onLoad}
          className="w-full h-[400px] border-0"
          title="Cross-Origin Routing Application"
        />
      </div>
    </div>
  );
}
