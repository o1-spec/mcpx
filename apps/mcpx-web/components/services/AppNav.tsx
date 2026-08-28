"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppNav() {
  const pathname = usePathname();

  const isOverview = pathname === "/app";
  const isServices = pathname?.startsWith("/app/services");
  const isWorkflows = pathname?.startsWith("/app/workflows");

  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
      <div className="flex items-center gap-6">
        <Link
          href="/app"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
            M
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            MCPx
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-xs">
          <Link
            href="/app"
            className={`px-2.5 py-1 rounded-md transition-colors ${
              isOverview
                ? "bg-slate-800 text-white font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Overview
          </Link>
          <Link
            href="/app/services"
            className={`px-2.5 py-1 rounded-md transition-colors ${
              isServices
                ? "bg-slate-800 text-white font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Services
          </Link>
          <Link
            href="/app/workflows"
            className={`px-2.5 py-1 rounded-md transition-colors ${
              isWorkflows
                ? "bg-slate-800 text-white font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Workflows
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Homepage
        </Link>
      </div>
    </div>
  );
}
