"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  loading?: boolean;
}

const variantStyles = {
  danger: { icon: "text-destructive", bg: "bg-destructive/10", button: "danger" as const },
  warning: { icon: "text-warning", bg: "bg-warning/10", button: "primary" as const },
  default: { icon: "text-muted-foreground", bg: "bg-muted", button: "primary" as const },
};

export function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "danger", onConfirm, loading,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/80 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-card p-6 shadow-dialog data-[state=open]:animate-scale-in">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.bg}`}>
              <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-base font-semibold text-foreground">{title}</Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-6 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={loading}>{cancelLabel}</Button>
            </Dialog.Close>
            <Button variant={styles.button} size="sm" onClick={onConfirm} disabled={loading}>
              {loading ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
