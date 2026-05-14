import { getShippingFee } from "./shipping.utils";

describe("getShippingFee", () => {
  it("returns inside Dhaka fee", () => {
    expect(getShippingFee("INSIDE_DHAKA")).toBe(80);
  });

  it("returns outside Dhaka fee", () => {
    expect(getShippingFee("OUTSIDE_DHAKA")).toBe(150);
  });
});
