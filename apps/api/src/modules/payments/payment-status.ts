/** Supported payment status values. */
export type PaymentStatus = "pending" | "initiated" | "paid" | "failed" | "cancelled";

const terminalStatuses = new Set<PaymentStatus>([
  "paid",
  "failed",
  "cancelled",
]);

/** Normalize persisted status strings into typed values. */
export const normalizePaymentStatus = (status?: string | null): PaymentStatus => {
  if (status === "initiated" || status === "paid" || status === "failed" || status === "cancelled") {
    return status;
  }
  return "pending";
};

/** Check whether a status is terminal. */
export const isTerminalStatus = (status: PaymentStatus): boolean => {
  return terminalStatuses.has(status);
};

/** Apply idempotent transition rules for payment status updates. */
export const applyPaymentTransition = (
  current: PaymentStatus,
  next: PaymentStatus,
): PaymentStatus => {
  if (isTerminalStatus(current)) {
    return current;
  }
  return next;
};
