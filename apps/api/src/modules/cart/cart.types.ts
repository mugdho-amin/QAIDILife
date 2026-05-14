/** Money DTO. */
export interface MoneyDto {
  /** Currency. */
  currency: "BDT";
  /** Amount. */
  amount: number;
}

/** Cart item DTO. */
export interface CartItemDto {
  /** Item id. */
  id: string;
  /** Product id. */
  product_id: string;
  /** Variant id. */
  variant_id: string;
  /** English title. */
  title_en: string;
  /** Bengali title. */
  title_bn: string;
  /** Image URL. */
  image: string;
  /** Quantity. */
  qty: number;
  /** Unit price. */
  unit_price: MoneyDto;
  /** Line total. */
  line_total: MoneyDto;
}

/** Cart DTO. */
export interface CartDto {
  /** Cart id. */
  id: string;
  /** Cart items. */
  items: CartItemDto[];
  /** Subtotal. */
  subtotal: MoneyDto;
}
