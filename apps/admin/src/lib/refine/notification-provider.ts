import type { NotificationProvider } from "@refinedev/core";

let toastId = 0;

function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const id = ++toastId;
  const container = document.getElementById("qaidilife-toast-container") || createContainer();

  const toast = document.createElement("div");
  toast.id = `toast-${id}`;
  toast.className = `relative flex items-center gap-3 rounded-xl border px-5 py-3 text-sm shadow-dialog animate-scale-in transition-all duration-300 pointer-events-auto ${
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300"
      : type === "error"
        ? "border-red-200 bg-red-50 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
        : "border-mist bg-panel text-ink"
  }`;
  toast.innerHTML = `
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    const el = document.getElementById(`toast-${id}`);
    if (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 300);
    }
  }, 4000);
}

function createContainer() {
  const container = document.createElement("div");
  container.id = "qaidilife-toast-container";
  container.className = "fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] flex flex-col-reverse items-center gap-3 p-6 pointer-events-none";
  document.body.appendChild(container);
  return container;
}

export const notificationProvider: NotificationProvider = {
  open: ({ message, type }) => {
    showToast(message ?? "", (type as "success" | "error") ?? "info");
  },
  close: (key) => {
    const el = document.getElementById(`toast-${key}`);
    if (el) el.remove();
  },
};
