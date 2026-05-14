"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface WishlistContextValue {
  items: string[];
  count: number;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue>({
  items: [], count: 0, toggle: () => {}, has: () => false,
});

function loadWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("qaidilife:wishlist") ?? "[]"); } catch { return []; }
}

function saveWishlist(items: string[]) {
  if (typeof window !== "undefined") localStorage.setItem("qaidilife:wishlist", JSON.stringify(items));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(loadWishlist);

  const toggle = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId];
      saveWishlist(next);
      return next;
    });
  }, []);

  const has = useCallback((productId: string) => items.includes(productId), [items]);

  return (
    <WishlistContext.Provider value={{ items, count: items.length, toggle, has }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
