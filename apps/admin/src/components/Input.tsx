import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium">
          {label}
        </span>
      )}
      <input
        {...props}
        className={`rounded-xl border px-4 py-3 text-base sm:text-sm text-ink outline-none transition-all duration-200 placeholder:text-text-muted/50 focus:ring-1 ${
          error
            ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5"
            : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"
        } ${className ?? ""}`}
      />
      {error && (
        <span className="text-xs text-danger mt-0.5">{error}</span>
      )}
    </label>
  );
}
