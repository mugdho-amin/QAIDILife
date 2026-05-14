import type { Product } from "./types";

const STORAGE_KEY = "qaidilife:recently_viewed";

/** Read recently viewed items from local storage. */
export const readRecentlyViewed = (): Product[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
};

/** Write recently viewed items to local storage. */
export const writeRecentlyViewed = (items: Product[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.slice(0, 12)),
  );
};

/** Add a product to the recently viewed list. */
export const addRecentlyViewed = (product: Product): void => {
  const current = readRecentlyViewed();
  const filtered: Product[] = [];
  for (const item of current) {
    if (item.id !== product.id) {
      filtered.push(item);
    }
  }
  writeRecentlyViewed([product, ...filtered]);
};
