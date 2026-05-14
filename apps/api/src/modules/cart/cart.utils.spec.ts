import { calculateSubtotal } from "./cart.utils";

describe("calculateSubtotal", () => {
  it("sums line totals from price and qty", () => {
    const subtotal = calculateSubtotal([
      { price: 500, qty: 2 },
      { price: 1200, qty: 1 },
    ]);

    expect(subtotal).toBe(2200);
  });

  it("returns zero for empty carts", () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});
