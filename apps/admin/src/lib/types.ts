/** Admin session payload. */
export interface AdminSession {
  /** JWT token. */
  token: string;
  /** Admin profile. */
  admin: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  };
}

/** Admin product variant data. */
export interface AdminVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  price: number;
}

/** Admin product data. */
export interface AdminProduct {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  primaryImage: string;
  gallery: string[];
  price: number;
  compareAt?: number | null;
  currency: string;
  variants: AdminVariant[];
  categories: AdminCategory[];
  createdAt: string;
}

/** Admin category data. */
export interface AdminCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
}

/** Admin order data. */
export interface AdminOrder {
  id: string;
  status: string;
  phone: string;
  shippingZone: string;
  shippingFee: number;
  subtotal: number;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    titleEn: string;
    titleBn: string;
    qty: number;
    price: number;
    image: string;
  }>;
}

/** Admin payment data. */
export interface AdminPayment {
  id: string;
  provider: string;
  status: string;
  amount: number;
  transactionId?: string | null;
  createdAt: string;
  orderId: string;
}

/** Admin metrics snapshot. */
export interface AdminMetrics {
  productCount: number;
  orderCount: number;
  pendingOrders: number;
  totalRevenue: number;
}
