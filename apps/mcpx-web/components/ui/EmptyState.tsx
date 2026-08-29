import React from "react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  actionText,
  actionHref,
  onAction,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`p-10 border border-white/8 bg-panel text-center flex flex-col items-center justify-center space-y-4 rounded-sm ${className}`}
    >
      <div className="w-10 h-10 rounded bg-background border border-white/10 flex items-center justify-center text-muted">
        {icon || (
          <svg
            className="w-5 h-5 opacity-80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
        )}
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm font-bold text-foreground font-sans">
          {title}
        </h3>
        <p className="text-xs text-muted font-sans leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && (
        <div className="pt-1">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors shadow-sm"
            >
              <span>{actionText}</span>
              <span>→</span>
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-foreground text-background hover:bg-white font-semibold text-xs font-sans transition-colors cursor-pointer shadow-sm"
            >
              <span>{actionText}</span>
              <span>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
