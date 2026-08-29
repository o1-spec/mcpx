import React from "react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string | React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  badge,
  breadcrumbs,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`space-y-3 pb-6 border-b border-white/[0.08] ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-[12px] font-mono text-[#66686D]">
          {breadcrumbs.map((b, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                {b.href && !isLast ? (
                  <Link
                    href={b.href}
                    className="hover:text-[#F5F5F3] transition-colors"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-[#A0A0A4]" : ""}>
                    {b.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#F5F5F3] font-sans">
              {title}
            </h1>
            {badge && (
              typeof badge === "string" ? (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#A0A0A4]">
                  {badge}
                </span>
              ) : (
                badge
              )
            )}
          </div>
          {description && (
            <p className="text-[13px] text-[#A0A0A4] max-w-2xl font-sans leading-normal">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
