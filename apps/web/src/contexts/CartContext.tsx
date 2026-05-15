"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getCart, addToCart, updateCartItem, removeCartItem, getCartId, setCartId, type CartDto } from "@/lib/cart";

const unwrap = (body: unknown): CartDto | null => {
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return (body as any).data ?? null;
  }
  return body as CartDto | null;
};

interface CartContextValue {
  cart: CartDto | null;
  loading: boolean;
  itemCount: number;
  refresh: () => Promise<void>;
  add: (productId: string, variantId: string, qty?: number) => Promise<void>;
  updateQty: (itemId: string, qty: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  cart: null, loading: false, itemCount: 0,
  refresh: async () => {}, add: async () => {}, updateQty: async () => {}, remove: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const id = getCartId();
    if (!id) { setLoading(false); return; }
    try {
      const result = await getCart();
      setCart(unwrap(result));
    } catch (err) {
      console.error("Cart refresh failed:", err);
      setCart(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const add = useCallback(async (productId: string, variantId: string, qty = 1) => {
    setCart(unwrap(await addToCart(productId, variantId, qty)));
    void refresh();
  }, [refresh]);

  const updateQty = useCallback(async (itemId: string, qty: number) => {
    setCart(await updateCartItem(itemId, qty));
  }, []);

  const remove = useCallback(async (itemId: string) => {
    await removeCartItem(itemId);
    setCart((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : null);
  }, []);

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.qty, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, refresh, add, updateQty, remove }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
