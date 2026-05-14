import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-mist bg-panel p-12 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-text-muted">
        {icon ?? <PackageOpen className="h-6 w-6" />}
      </div>
      <h3 className="mt-5 text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-secondary max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
