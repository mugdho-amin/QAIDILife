import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="animate-slide-in">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-ink" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink font-display">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-2 text-sm text-text-secondary ml-9 max-w-xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-3 items-center animate-fade-in">
          {actions}
        </div>
      )}
    </div>
  );
}
