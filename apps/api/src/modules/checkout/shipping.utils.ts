/** Supported shipping zones. */
export type ShippingZone = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

/** Compute shipping fee based on zone. */
export const getShippingFee = (zone: ShippingZone): number => {
  return zone === "INSIDE_DHAKA" ? 80 : 150;
};
