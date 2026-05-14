import {
  applyPaymentTransition,
  isTerminalStatus,
  normalizePaymentStatus,
} from "./payment-status";

describe("payment status helpers", () => {
  it("normalizes unknown values to pending", () => {
    expect(normalizePaymentStatus("unknown")).toBe("pending");
    expect(normalizePaymentStatus(undefined)).toBe("pending");
  });

  it("detects terminal statuses", () => {
    expect(isTerminalStatus("paid")).toBe(true);
    expect(isTerminalStatus("failed")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("pending")).toBe(false);
  });

  it("keeps terminal status when transition is applied", () => {
    expect(applyPaymentTransition("paid", "failed")).toBe("paid");
    expect(applyPaymentTransition("failed", "paid")).toBe("failed");
  });

  it("allows non-terminal transitions", () => {
    expect(applyPaymentTransition("pending", "initiated")).toBe("initiated");
    expect(applyPaymentTransition("initiated", "paid")).toBe("paid");
  });
});
