import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantStyles: Record<string, string> = {
  default: "bg-accent-soft text-text-secondary border-transparent",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  danger: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
};

export function Tag({ label, variant = "default" }: TagProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-lg border px-2.5 py-1 text-xs font-medium tracking-wide",
        variantStyles[variant],
      )}
    >
      {label}
    </span>
  );
}
