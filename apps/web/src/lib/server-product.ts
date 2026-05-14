import type { Product } from "./types";
import { featuredProducts } from "./mock-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/** Find a product from fallback data by id or slug. */
const findFallbackProduct = (id: string): Product | null => {
  for (const product of featuredProducts) {
    if (product.id === id || product.slug === id) {
      return product;
    }
  }
  return null;
};

/** Fetch product data for server-side metadata and OG rendering. */
export const fetchProductForSeo = async (id: string): Promise<Product | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/products/${id}`, {
      next: { revalidate: 120 },
    });
    if (!response.ok) {
      return findFallbackProduct(id);
    }
    const data = (await response.json()) as Product;
    return data;
  } catch {
    return findFallbackProduct(id);
  }
};
