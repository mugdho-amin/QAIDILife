"use client";

import { useEffect, useState } from "react";
import { getApiClient } from "@/lib/api";
import { getLocalCartCount } from "@/lib/local-cart";

/** Hook for tracking cart item count. */
export const useCartCount = () => {
  const [count, setCount] = useState(0);

  /** Sum quantities from cart items. */
  const sumQuantities = (items: { qty: number }[]) => {
    let total = 0;
    for (const item of items) {
      total += item.qty;
    }
    return total;
  };

  /** Load cart from API and update count. */
  const loadCart = async () => {
    try {
      const cart = await getApiClient().getCart();
      setCount(sumQuantities(cart.items));
    } catch {
      setCount(getLocalCartCount());
    }
  };

  /** Initialize cart count. */
  const initLoad = () => {
    void loadCart();
  };

  useEffect(initLoad, []);

  useEffect(() => {
    const handleUpdate = () => {
      void loadCart();
    };
    window.addEventListener("qaidilife:cart_updated", handleUpdate);
    return () => {
      window.removeEventListener("qaidilife:cart_updated", handleUpdate);
    };
  }, []);

  return count;
};
