import type { Product } from "./types";

const STORAGE_KEY = "qaidilife:local_cart";

export interface LocalCartItem {
  productId: string;
  variantId: string;
  qty: number;
  product?: Product;
}

/** Read local cart items from storage. */
export const readLocalCart = (): LocalCartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as LocalCartItem[];
  } catch {
    return [];
  }
};

/** Persist local cart items to storage. */
export const writeLocalCart = (items: LocalCartItem[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

/** Add an item to local cart storage. */
export const addLocalCartItem = (
  product: Product,
  variantId: string,
  qty: number,
): void => {
  const current = readLocalCart();
  const updated: LocalCartItem[] = [];
  let matched = false;
  for (const item of current) {
    if (item.productId === product.id && item.variantId === variantId) {
      updated.push({ ...item, qty: item.qty + qty, product });
      matched = true;
    } else {
      updated.push(item);
    }
  }
  if (!matched) {
    updated.push({ productId: product.id, variantId, qty, product });
  }
  writeLocalCart(updated);
};

/** Compute total quantity from local cart. */
export const getLocalCartCount = (): number => {
  const items = readLocalCart();
  let total = 0;
  for (const item of items) {
    total += item.qty;
  }
  return total;
};

/** Notify listeners that cart changed. */
export const emitCartUpdated = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event("qaidilife:cart_updated"));
};
