"use client";

import { ShoppingBag } from "lucide-react";

/** Props for the sticky add-to-cart bar. */
export interface AddToCartBarProps {
  /** Button label. */
  label?: string;
  /** Click handler. */
  onAdd: () => void;
}

/** Sticky add-to-cart call to action for mobile. */
export function AddToCartBar({ label = "Add to Cart", onAdd }: AddToCartBarProps) {
  return (
    <button
      onClick={onAdd}
      className="fixed bottom-16 left-4 right-4 z-40 flex items-center justify-center gap-3 rounded-full bg-ink py-4 text-xs uppercase tracking-[0.3em] text-canvas sm:hidden"
    >
      <ShoppingBag className="h-4 w-4" />
      {label}
    </button>
  );
}
