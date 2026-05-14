import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98]",
        variant === "primary" && "bg-ink text-canvas hover:bg-ink/90 shadow-sm",
        variant === "outline" && "border border-mist text-ink hover:bg-accent-soft",
        variant === "ghost" && "text-text-secondary hover:text-ink hover:bg-accent-soft",
        variant === "danger" && "bg-danger text-white hover:bg-danger/90 shadow-sm",
        size === "sm" && "rounded-xl px-3 py-1.5 text-xs",
        size === "md" && "rounded-xl px-4 py-2.5 text-sm",
        size === "lg" && "rounded-2xl px-6 py-3 text-sm",
        className,
      )}
    />
  );
}
