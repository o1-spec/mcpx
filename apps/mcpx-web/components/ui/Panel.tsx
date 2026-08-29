import React from "react";

interface PanelProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export default function Panel({
  children,
  title,
  subtitle,
  badge,
  actions,
  className = "",
  headerClassName = "",
  bodyClassName = "",
}: PanelProps) {
  const hasHeader = Boolean(title || actions || badge);

  return (
    <div
      className={`border border-white/[0.08] bg-[#0B0C0E] transition-colors rounded-sm overflow-hidden ${className}`}
    >
      {hasHeader && (
        <div
          className={`flex items-center justify-between border-b border-white/[0.06] px-5 py-3 bg-[#0B0C0E] ${headerClassName}`}
        >
          <div className="flex items-center gap-2.5">
            {typeof title === "string" ? (
              <span className="text-[11.5px] font-mono font-bold text-[#F5F5F3] uppercase tracking-wider">
                {title}
              </span>
            ) : (
              title
            )}
            {badge}
            {subtitle && (
              <span className="text-[11px] font-sans text-[#66686D]">
                {subtitle}
              </span>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
