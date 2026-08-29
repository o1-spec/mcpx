import React from "react";

export type StatusType =
  | "READY"
  | "EXECUTING"
  | "SUCCEEDED"
  | "IN_DOUBT"
  | "RECONCILING"
  | "RECOVERED"
  | "FAILED"
  | "COMPENSATING"
  | "COMPENSATED"
  | "CONNECTED"
  | "DISCONNECTED"
  | "DRAFT"
  | "NEEDS_REVIEW"
  | "INVALID"
  | "ACTIVE"
  | "INACTIVE";

interface StatusPillProps {
  status: StatusType | string;
  size?: "sm" | "md";
  className?: string;
  showDot?: boolean;
}

export default function StatusPill({
  status,
  size = "sm",
  className = "",
  showDot = true,
}: StatusPillProps) {
  const norm = (status || "").toUpperCase().replace(/[\s-]/g, "_");

  let styles = "bg-white/4 text-muted border-white/8";
  let dotColor = "bg-[#A0A0A4]";
  let label = status;

  switch (norm) {
    case "READY":
    case "SUCCEEDED":
    case "RECOVERED":
    case "CONNECTED":
    case "ACTIVE":
      styles = "bg-emerald-950/50 text-accent-lime border-accent-lime/30";
      dotColor = "bg-accent-lime";
      break;

    case "EXECUTING":
    case "RECONCILING":
    case "COMPENSATING":
      styles = "bg-cyan-950/50 text-cyan-300 border-cyan-500/30";
      dotColor = "bg-cyan-400 animate-pulse";
      break;

    case "IN_DOUBT":
    case "NEEDS_REVIEW":
    case "DRAFT":
      styles = "bg-amber-950/50 text-amber-300 border-amber-500/30";
      dotColor = "bg-amber-400";
      break;

    case "FAILED":
    case "INVALID":
    case "DISCONNECTED":
      styles = "bg-rose-950/50 text-rose-300 border-rose-500/30";
      dotColor = "bg-rose-400";
      break;

    case "COMPENSATED":
      styles = "bg-white/4 text-muted border-white/8";
      dotColor = "bg-[#66686D]";
      break;
  }

  const sizeStyles =
    size === "sm"
      ? "text-xs px-2 py-0.5"
      : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono font-medium border ${sizeStyles} ${styles} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      )}
      <span>{label}</span>
    </span>
  );
}
