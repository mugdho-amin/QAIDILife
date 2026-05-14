"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Check, X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  description?: string;
  type: "success" | "error" | "info";
}

interface ToastContextValue {
  show: (message: string, type?: Toast["type"], description?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast["type"] = "info", description?: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-1), { id, message, description, type }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg animate-slide-up ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : toast.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-mist bg-white text-ink"
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === "success" && <Check className="h-4 w-4 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{toast.message}</p>
                {toast.description && (
                  <p className="text-xs opacity-75 mt-0.5">{toast.description}</p>
                )}
              </div>
              <button onClick={() => dismiss(toast.id)} className="shrink-0 opacity-50 hover:opacity-100 transition mt-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
