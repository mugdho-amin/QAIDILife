import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, ...props }, ref) {
    return (
      <label className="flex flex-col gap-1.5">
        {label && (
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">
            {label}
          </span>
        )}
        <input
          ref={ref}
          {...props}
          className={`rounded-xl border px-4 py-3 text-base sm:text-sm text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-1 ${
            error
              ? "border-destructive/50 focus:border-destructive focus:ring-destructive/10 bg-destructive/5"
              : "border-border bg-background focus:border-foreground/30 focus:ring-ring/10"
          } ${className ?? ""}`}
        />
        {error && (
          <span className="text-xs text-destructive mt-0.5">{error}</span>
        )}
      </label>
    );
  },
);
