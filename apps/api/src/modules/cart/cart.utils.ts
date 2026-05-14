/** Cart line item input for subtotal calculations. */
export interface CartLineItemInput {
  /** Unit price in minor units. */
  price: number;
  /** Quantity. */
  qty: number;
}

/** Calculate subtotal for a set of cart line items. */
export const calculateSubtotal = (items: CartLineItemInput[]): number => {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.price * item.qty;
  }
  return subtotal;
};
