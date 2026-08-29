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
      className={`p-10 border border-white/[0.08] bg-[#0B0C0E] text-center flex flex-col items-center justify-center space-y-4 rounded-sm ${className}`}
    >
      <div className="w-10 h-10 rounded bg-[#070708] border border-white/[0.1] flex items-center justify-center text-[#A0A0A4]">
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
        <h3 className="text-[14px] font-bold text-[#F5F5F3] font-sans">
          {title}
        </h3>
        <p className="text-[12.5px] text-[#A0A0A4] font-sans leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && (
        <div className="pt-1">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[12px] font-sans transition-colors shadow-sm"
            >
              <span>{actionText}</span>
              <span>→</span>
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[12px] font-sans transition-colors cursor-pointer shadow-sm"
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
