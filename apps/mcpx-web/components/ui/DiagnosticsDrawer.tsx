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
      <div className="relative z-10 w-full max-w-xl bg-[#0B0C0E] border-l border-white/[0.08] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#070708]">
          <div className="space-y-0.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#A5F36B]">
              [ DIAGNOSTICS ]
            </div>
            <h2 className="text-[15px] font-bold text-[#F5F5F3] font-sans">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/[0.06] text-[#A0A0A4] hover:text-[#F5F5F3] transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-[11.5px] space-y-4">
          <div className="flex items-center justify-between text-[11px] text-[#66686D]">
            <span>PAYLOAD SNAPSHOT</span>
            <button
              onClick={() => navigator.clipboard.writeText(formattedJson)}
              className="text-[#A0A0A4] hover:text-[#A5F36B] transition-colors cursor-pointer"
            >
              Copy JSON
            </button>
          </div>

          <pre className="p-4 bg-[#070708] border border-white/[0.06] rounded text-[#A0A0A4] overflow-x-auto whitespace-pre leading-relaxed text-[11px]">
            {formattedJson}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-[#070708] flex items-center justify-between text-[11px] font-mono text-[#66686D]">
          <span>WEBMCP COORDINATOR TRACE</span>
          <span>PRESS ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
}
