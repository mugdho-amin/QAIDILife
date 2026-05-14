"use client";

import { useState, useCallback, useEffect } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { getCartId } from "@/lib/cart";
import { getApiClient } from "@/lib/api";
import { Minus, Plus, Trash2, Truck, ShieldCheck, Lock } from "lucide-react";

type ShippingZone = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
type PaymentMethod = "SSLCOMMERZ" | "SHURJOPAY" | "COD";

const SHIPPING_FEES: Record<ShippingZone, number> = {
  INSIDE_DHAKA: 80,
  OUTSIDE_DHAKA: 150,
};

export default function CheckoutPage() {
  const { cart, itemCount, loading, updateQty, remove, refresh } = useCart();
  const { show: toast } = useToast();

  // Retry cart load if empty on mount
  useEffect(() => {
    if (!loading && !cart?.items.length && getCartId()) {
      void refresh();
    }
  }, []);

  const [phone, setPhone] = useState("");
  const [shipping, setShipping] = useState<ShippingZone>("INSIDE_DHAKA");
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [submitting, setSubmitting] = useState(false);

  const shippingFee = SHIPPING_FEES[shipping];
  const subtotal = cart?.subtotal.amount ?? 0;
  const total = subtotal + shippingFee;
  const isEmpty = !cart || cart.items.length === 0;

  const handleCheckout = useCallback(async () => {
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length < 10) { toast("Enter a valid phone number", "error", "e.g. 01XXXXXXXXX"); return; }
    if (!cart?.id) { toast("Cart is empty", "error"); return; }

    setSubmitting(true);
    try {
      const client = getApiClient();
      const checkout = await client.checkout({
        cart_id: cart.id,
        phone: cleaned,
        shipping_zone: shipping as "INSIDE_DHAKA" | "OUTSIDE_DHAKA",
      });

      if (payment === "COD") {
        toast("Order placed!", "success", `Order #${checkout.order_id.slice(0, 8)} — Pay ৳${total.toLocaleString("en-BD")} on delivery`);
      } else {
        await client.createPayment({
          order_id: checkout.order_id,
          provider: payment as "SSLCOMMERZ" | "SHURJOPAY",
        });
        toast("Redirecting to payment...", "info");
      }
    } catch (err: any) {
      toast("Checkout failed", "error", err?.message ?? "Please try again");
    }
    setSubmitting(false);
  }, [phone, shipping, payment, cart, total, toast]);

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 text-xs text-text-muted">
            <span className="text-ink">Home</span> / Checkout
          </div>
          <h1 className="text-2xl font-semibold font-display tracking-tight">Checkout</h1>
          <p className="mt-1 text-sm text-text-secondary">{itemCount} item{itemCount !== 1 ? "s" : ""} in your cart</p>

          {loading ? (
            <div className="mt-8 space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-mist/50" />)}
            </div>
          ) : isEmpty ? (
            <div className="mt-12 text-center">
              <p className="text-sm text-text-secondary">Your cart is empty</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
              {/* Left: Cart items + form */}
              <div className="space-y-8">
                {/* Cart items */}
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted mb-4">Items</h2>
                  <div className="divide-y divide-mist/50">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex gap-4 py-4">
                        <div className="h-20 w-16 shrink-0 rounded-lg bg-mist/50 overflow-hidden">
                          {item.image && <img src={item.image} alt={item.title_en} className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{item.title_en}</p>
                          <p className="text-xs text-text-muted mt-0.5">৳{item.unit_price.amount.toLocaleString("en-BD")}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { if (item.qty <= 1) remove(item.id); else updateQty(item.id, item.qty - 1); }} className="flex h-7 w-7 items-center justify-center rounded-full border border-mist hover:bg-accent-soft transition">
                                {item.qty <= 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, item.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-mist hover:bg-accent-soft transition">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-sm font-medium">৳{item.line_total.amount.toLocaleString("en-BD")}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Contact info */}
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted mb-4">Contact</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium">Phone Number</label>
                      <input
                        type="tel" inputMode="tel" value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="mt-2 h-11 w-full rounded-xl border border-mist bg-canvas px-4 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 transition"
                      />
                      <p className="mt-1.5 text-xs text-text-muted">We'll send order updates to this number</p>
                    </div>
                  </div>
                </section>

                {/* Shipping */}
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted mb-4 flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5" /> Shipping
                  </h2>
                  <select
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value as ShippingZone)}
                    className="h-11 w-full rounded-xl border border-mist bg-canvas px-4 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 transition"
                  >
                    <option value="INSIDE_DHAKA">Inside Dhaka — ৳80</option>
                    <option value="OUTSIDE_DHAKA">Outside Dhaka — ৳150</option>
                  </select>
                </section>

                {/* Payment */}
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> Payment Method
                  </h2>
                  <div className="space-y-3">
                    {([
                      ["SSLCOMMERZ", "SSLCommerz — bKash, Nagad, Cards"],
                      ["SHURJOPAY", "ShurjoPay — bKash, Nagad, Cards"],
                      ["COD", "Cash on Delivery"],
                    ] as [PaymentMethod, string][]).map(([value, label]) => (
                      <label key={value} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition cursor-pointer ${payment === value ? "border-ink bg-accent-soft" : "border-mist bg-canvas hover:bg-accent-soft/50"}`}>
                        <input type="radio" name="payment" value={value} checked={payment === value} onChange={(e) => setPayment(e.target.value as PaymentMethod)} className="accent-ink" />
                        {label}
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right: Order summary */}
              <div className="lg:sticky lg:top-28 h-fit">
                <div className="rounded-2xl border border-mist bg-panel p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Order Summary</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Subtotal</span>
                      <span>৳{subtotal.toLocaleString("en-BD")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Shipping</span>
                      <span>৳{shippingFee.toLocaleString("en-BD")}</span>
                    </div>
                    {subtotal >= 3000 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Free Shipping</span>
                        <span>-৳{shippingFee.toLocaleString("en-BD")}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-mist pt-4 flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>৳{total.toLocaleString("en-BD")}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="w-full rounded-xl bg-ink py-3.5 text-sm font-medium text-canvas hover:bg-ink/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-canvas border-t-transparent" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Place Order — ৳{total.toLocaleString("en-BD")}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-text-muted">Secure checkout. Your info is encrypted.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileNav cartCount={itemCount} active="cart" />
    </div>
  );
}
