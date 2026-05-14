/** Currency-supported money value. */
export interface Money {
  /** ISO currency code. */
  currency: string;
  /** Numeric amount. */
  amount: number;
}

/** Product variant data. */
export interface ProductVariant {
  /** Variant identifier. */
  id: string;
  /** Variant SKU. */
  sku: string;
  /** Size label. */
  size: string;
  /** Color label. */
  color: string;
  /** Available stock. */
  stock: number;
  /** Variant price. */
  price: Money;
}

/** Product domain model. */
export interface Product {
  /** Product identifier. */
  id: string;
  /** SEO slug. */
  slug: string;
  /** English title. */
  title_en: string;
  /** Bengali title. */
  title_bn: string;
  /** English description. */
  description_en?: string;
  /** Bengali description. */
  description_bn?: string;
  /** Primary image URL. */
  primary_image: string;
  /** Gallery image URLs. */
  gallery?: string[];
  /** Base price. */
  price: Money;
  /** Optional compare-at price. */
  compare_at?: Money;
  /** Product variants. */
  variants: ProductVariant[];
}

/** Category model. */
export interface Category {
  /** Category identifier. */
  id: string;
  /** Slug. */
  slug: string;
  /** English name. */
  name_en: string;
  /** Bengali name. */
  name_bn: string;
}

/** Cart line item. */
export interface CartItem {
  /** Cart item identifier. */
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
  unit_price: Money;
  /** Line total. */
  line_total: Money;
}

/** Cart model. */
export interface Cart {
  /** Cart identifier. */
  id: string;
  /** Cart items. */
  items: CartItem[];
  /** Subtotal. */
  subtotal: Money;
}
