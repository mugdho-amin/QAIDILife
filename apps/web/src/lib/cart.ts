const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

let cartId: string | null = null;

export function getCartId(): string | null {
  if (typeof window === "undefined") return null;
  const stored = cartId ?? localStorage.getItem("qaidilife:cart_id");
  cartId = stored;
  return stored;
}

export function setCartId(id: string) {
  cartId = id;
  if (typeof window !== "undefined") localStorage.setItem("qaidilife:cart_id", id);
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const id = getCartId();
  if (id) headers["x-cart-id"] = id;

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...(init.headers as Record<string, string> ?? {}) } });
  const newCartId = response.headers.get("x-cart-id");
  if (newCartId) setCartId(newCartId);
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try { const body = await response.text(); if (body) detail = body.slice(0, 200); } catch {}
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  subtotal: { currency: string; amount: number };
}

export interface CartItemDto {
  id: string;
  product_id: string;
  variant_id: string;
  title_en: string;
  title_bn: string;
  image: string;
  qty: number;
  unit_price: { currency: string; amount: number };
  line_total: { currency: string; amount: number };
}

export async function getCart(): Promise<CartDto> {
  return apiFetch<CartDto>("/v1/cart");
}

export async function addToCart(productId: string, variantId: string, qty = 1): Promise<CartDto> {
  return apiFetch<CartDto>("/v1/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, variantId, qty }),
  });
}

export async function updateCartItem(itemId: string, qty: number): Promise<CartDto> {
  return apiFetch<CartDto>(`/v1/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ qty }),
  });
}

export async function removeCartItem(itemId: string): Promise<void> {
  return apiFetch<void>(`/v1/cart/items/${itemId}`, { method: "DELETE" });
}
