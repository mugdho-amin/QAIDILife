"use client";

import { X, ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useEffect } from "react";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, loading, itemCount, updateQty, remove } = useCart();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 animate-fade-in" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50">Cart</p>
            <p className="text-sm font-medium">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 transition" aria-label="Close cart">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-black/5" />)}
            </div>
          ) : !cart?.items?.length ? (
            <div className="flex flex-col items-center justify-center pt-16 text-center">
              <ShoppingBag className="h-10 w-10 text-ink/20" />
              <p className="mt-4 text-sm font-medium text-ink/60">Your cart is empty</p>
              <p className="mt-1 text-xs text-ink/40">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-black/5 pb-4">
                  <div className="h-20 w-16 shrink-0 rounded-lg bg-black/5 overflow-hidden">
                    {item.image && <img src={item.image} alt={item.title_en} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title_en}</p>
                    <p className="text-xs text-ink/50 mt-0.5">৳{item.unit_price.amount.toLocaleString("en-BD")}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { if (item.qty <= 1) remove(item.id); else updateQty(item.id, item.qty - 1); }} className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 hover:bg-black/5 transition">
                          {item.qty <= 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 hover:bg-black/5 transition">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium">৳{item.line_total.amount.toLocaleString("en-BD")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          {cart?.items?.length ? (
            <div className="border-t border-black/10 px-5 py-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink/60">Subtotal</span>
                <span className="font-medium">৳{cart.subtotal.amount.toLocaleString("en-BD")}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onClose(); window.location.href = "/cart"; }}
                  className="flex-1 rounded-full border border-ink py-3.5 text-xs uppercase tracking-[0.3em] text-ink font-medium hover:bg-black/5 transition"
                >
                  View Cart
                </button>
                <button
                  onClick={() => { onClose(); window.location.href = "/checkout"; }}
                  className="flex-1 rounded-full bg-ink py-3.5 text-xs uppercase tracking-[0.3em] text-white font-medium hover:bg-ink/90 transition"
                >
                  Checkout
                </button>
              </div>
            </div>
          ) : null}
      </div>
    </>
  );
}
