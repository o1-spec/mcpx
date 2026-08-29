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
      className={`border border-white/8 bg-panel transition-colors rounded-sm overflow-hidden ${className}`}
    >
      {hasHeader && (
        <div
          className={`flex items-center justify-between border-b border-white/6 px-5 py-3 bg-panel ${headerClassName}`}
        >
          <div className="flex items-center gap-2.5">
            {typeof title === "string" ? (
              <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                {title}
              </span>
            ) : (
              title
            )}
            {badge}
            {subtitle && (
              <span className="text-xs font-sans text-subtle">
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
