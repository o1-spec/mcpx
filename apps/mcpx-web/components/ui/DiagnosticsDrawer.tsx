"use client";

import React, { useEffect } from "react";

interface DiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  data: unknown;
}

export default function DiagnosticsDrawer({
  isOpen,
  onClose,
  title = "Developer Diagnostics",
  data,
}: DiagnosticsDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedJson =
    typeof data === "string"
      ? data
      : JSON.stringify(data, null, 2) || "No diagnostic state captured.";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-w-xl bg-panel border-l border-white/8 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-background">
          <div className="space-y-0.5">
            <div className="text-xs font-mono uppercase tracking-wider text-accent-lime">
              [ DIAGNOSTICS ]
            </div>
            <h2 className="text-sm font-bold text-foreground font-sans">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/6 text-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-4">
          <div className="flex items-center justify-between text-xs text-subtle">
            <span>PAYLOAD SNAPSHOT</span>
            <button
              onClick={() => navigator.clipboard.writeText(formattedJson)}
              className="text-muted hover:text-accent-lime transition-colors cursor-pointer"
            >
              Copy JSON
            </button>
          </div>

          <pre className="p-4 bg-background border border-white/6 rounded text-muted overflow-x-auto whitespace-pre leading-relaxed text-xs">
            {formattedJson}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/6 bg-background flex items-center justify-between text-xs font-mono text-subtle">
          <span>WEBMCP COORDINATOR TRACE</span>
          <span>PRESS ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
}
