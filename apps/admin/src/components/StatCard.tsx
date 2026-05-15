import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}

const trendConfig = {
  up: { icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
  down: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
  neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" },
};

export function StatCard({ label, value, hint, icon, trend }: StatCardProps) {
  const t = trend ? trendConfig[trend] : null;

  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-panel hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">{label}</p>
        <div className={`flex items-center justify-center ${t?.bg ?? "bg-muted"} rounded-xl p-2.5 group-hover:scale-105 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
      <div className="mt-5 flex items-baseline gap-3">
        <span className="text-3xl font-semibold text-foreground font-display tracking-tight">{value}</span>
        {t && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${t.color}`}>
            <t.icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
