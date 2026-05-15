"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { getCartId } from "@/lib/cart";
import { getApiClient } from "@/lib/api";
import { addGuestOrder } from "@/lib/guest-orders";
import { Minus, Plus, Trash2, Truck, ShieldCheck, Lock } from "lucide-react";

type ShippingZone = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
type PaymentMethod = "SSLCOMMERZ" | "SHURJOPAY" | "COD";

const SHIPPING_FEES: Record<ShippingZone, number> = {
  INSIDE_DHAKA: 80,
  OUTSIDE_DHAKA: 150,
};

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export default function CheckoutPage() {
  const { cart, itemCount, loading, updateQty, remove, refresh } = useCart();
  const { show: toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !cart?.items?.length && getCartId()) {
      void refresh();
    }
  }, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [shipping, setShipping] = useState<ShippingZone>("INSIDE_DHAKA");
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const shippingFee = SHIPPING_FEES[shipping];
  const subtotal = cart?.subtotal.amount ?? 0;
  const freeShipping = subtotal >= 3000;
  const total = subtotal + (freeShipping ? 0 : shippingFee);
  const isEmpty = !cart || cart.items.length === 0;

  const validate = useCallback((): FormErrors => {
    const e: FormErrors = {};
    const cleaned = name.trim();
    if (!cleaned || cleaned.length < 2) e.name = "Enter your full name";
    const cleanedPhone = phone.replace(/[^0-9]/g, "");
    if (cleanedPhone.length < 11) e.phone = "Enter a valid 11-digit phone number (e.g. 01XXXXXXXXX)";
    else if (!/^01[3-9]\d{8}$/.test(cleanedPhone)) e.phone = "Enter a valid Bangladeshi phone number";
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) e.email = "Enter a valid email address";
    }
    const cleanedAddr = address.trim();
    if (!cleanedAddr || cleanedAddr.length < 5) e.address = "Enter your full delivery address";
    return e;
  }, [name, phone, email, address]);

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, ...validate() }));
  };

  const handleChange = (field: keyof FormErrors, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      setErrors((prev) => {
        const next = { ...prev, ...validate() };
        return next;
      });
    }
  };

  const handleCheckout = useCallback(async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({ name: true, phone: true, email: true, address: true });

    if (Object.keys(validationErrors).length > 0) {
      const firstError = document.querySelector<HTMLElement>("[data-error]");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!cart?.id) { toast("Cart is empty", "error"); return; }

    setSubmitting(true);
    try {
      const client = getApiClient();
      const cleanedPhone = phone.replace(/[^0-9]/g, "");
      const checkout = await client.checkout({
        cart_id: cart.id,
        name: name.trim(),
        phone: cleanedPhone,
        email: email.trim() || undefined,
        address: address.trim(),
        delivery_notes: deliveryNotes.trim() || undefined,
        shipping_zone: shipping,
      });

      if (payment === "COD") {
        addGuestOrder({
          id: checkout.order_id,
          status: "pending",
          name: name.trim(),
          phone: cleanedPhone,
          total: { currency: "BDT", amount: total },
          subtotal: { currency: "BDT", amount: subtotal },
          shipping: { zone: shipping, fee: { currency: "BDT", amount: freeShipping ? 0 : shippingFee } },
          created_at: new Date().toISOString(),
          items: (cart?.items ?? []).map((item) => ({
            id: item.id,
            title_en: item.title_en,
            image: item.image,
            qty: item.qty,
            unit_price: item.unit_price,
            line_total: item.line_total,
          })),
        });
        toast("Order placed!", "success", `Order confirmed — pay ৳${total.toLocaleString("en-BD")} on delivery`);
        window.location.href = "/orders";
        return;
      } else {
        const session = await client.createPayment({
          order_id: checkout.order_id,
          provider: payment,
        });
        if (session.redirect_url) {
          window.location.href = session.redirect_url;
        } else {
          toast("Redirecting to payment...", "info");
        }
      }
    } catch (err: any) {
      toast("Checkout failed", "error", err?.message ?? "Please try again");
    }
    setSubmitting(false);
  }, [name, phone, email, address, deliveryNotes, shipping, payment, cart, total, toast, validate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      e.preventDefault();
      void handleCheckout();
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `mt-2 h-11 w-full rounded-xl border px-4 text-sm text-ink outline-none transition ${
      errors[field] && touched[field]
        ? "border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300"
        : "border-[#e5dfd9] focus:border-ink/30 focus:ring-1 focus:ring-ink/10"
    }`;

  return (
    <div className="min-h-screen pb-28 sm:pb-24">
      <Header />
      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
              <p className="mt-1 text-sm text-[#8a8a8a]">{itemCount} item{itemCount !== 1 ? "s" : ""} in your cart</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-black/5" />)}
            </div>
          ) : isEmpty ? (
            <div className="mt-12 text-center">
              <p className="text-sm text-[#8a8a8a]">Your cart is empty</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr]" ref={formRef}>
              {/* Left column */}
              <div className="space-y-8" onKeyDown={handleKeyDown}>
                {/* Contact */}
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a8a8a] mb-4">Contact</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a] font-medium">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleChange("name", e.target.value, setName)}
                        onBlur={() => handleBlur("name")}
                        placeholder="John Doe"
                        autoFocus
                        className={inputClass("name")}
                        data-error={errors.name && touched.name ? "true" : undefined}
                      />
                      {errors.name && touched.name && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a] font-medium">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => handleChange("phone", e.target.value, setPhone)}
                        onBlur={() => handleBlur("phone")}
                        placeholder="01XXXXXXXXX"
                        className={inputClass("phone")}
                        data-error={errors.phone && touched.phone ? "true" : undefined}
                      />
                      {errors.phone && touched.phone && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>
                      )}
                      <p className="mt-1.5 text-xs text-[#8a8a8a]">We'll send order updates to this number</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a] font-medium">
                        Email <span className="text-[#8a8a8a]/50">(optional)</span>
                      </label>
                      <input
                        type="email"
                        inputMode="email"
                        value={email}
                        onChange={(e) => handleChange("email", e.target.value, setEmail)}
                        onBlur={() => handleBlur("email")}
                        placeholder="john@example.com"
                        className={inputClass("email")}
                        data-error={errors.email && touched.email ? "true" : undefined}
                      />
                      {errors.email && touched.email && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
                      )}
                      <p className="mt-1.5 text-xs text-[#8a8a8a]">For digital receipt and order updates</p>
                    </div>
                  </div>
                </section>

                {/* Delivery Address */}
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a8a8a] mb-4 flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5" /> Delivery
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a] font-medium">
                        Full Address <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => handleChange("address", e.target.value, setAddress)}
                        onBlur={() => handleBlur("address")}
                        placeholder="Street, area, district — e.g. 42 Gulshan Ave, Dhaka"
                        rows={3}
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-ink outline-none resize-none transition ${
                          errors.address && touched.address
                            ? "border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300"
                            : "border-[#e5dfd9] focus:border-ink/30 focus:ring-1 focus:ring-ink/10"
                        }`}
                        data-error={errors.address && touched.address ? "true" : undefined}
                      />
                      {errors.address && touched.address && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.address}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a] font-medium">
                        Delivery Zone
                      </label>
                      <select
                        value={shipping}
                        onChange={(e) => setShipping(e.target.value as ShippingZone)}
                        className="mt-2 h-11 w-full rounded-xl border border-[#e5dfd9] bg-white px-4 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 transition"
                      >
                        <option value="INSIDE_DHAKA">Inside Dhaka — ৳80</option>
                        <option value="OUTSIDE_DHAKA">Outside Dhaka — ৳150</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a] font-medium">
                        Delivery Notes <span className="text-[#8a8a8a]/50">(optional)</span>
                      </label>
                      <textarea
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Gate code, landmark, preferred delivery time, etc."
                        rows={2}
                        className="mt-2 w-full rounded-xl border border-[#e5dfd9] px-4 py-3 text-sm text-ink outline-none resize-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 transition"
                      />
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a8a8a] mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> Payment Method
                  </h2>
                  <div className="space-y-3">
                    {([
                      ["SSLCOMMERZ", "SSLCommerz — bKash, Nagad, Cards"],
                      ["SHURJOPAY", "ShurjoPay — bKash, Nagad, Cards"],
                      ["COD", "Cash on Delivery"],
                    ] as [PaymentMethod, string][]).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition cursor-pointer ${
                          payment === value
                            ? "border-[#1a1a1a] bg-black/5"
                            : "border-[#e5dfd9] bg-white hover:bg-black/[0.02]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={value}
                          checked={payment === value}
                          onChange={(e) => setPayment(e.target.value as PaymentMethod)}
                          className="h-4 w-4 accent-[#1a1a1a]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right column */}
              <div className="lg:sticky lg:top-28 h-fit">
                <div className="rounded-2xl border border-[#e5dfd9] bg-white p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a8a8a]">Order Summary</h2>

                  {/* Items */}
                  <div className="divide-y divide-black/5">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex gap-3 py-3 first:pt-0">
                        <div className="h-16 w-12 shrink-0 rounded-lg bg-black/5 overflow-hidden">
                          {item.image && <img src={item.image} alt={item.title_en} className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title_en}</p>
                          <p className="text-xs text-[#8a8a8a] mt-0.5">Qty: {item.qty}</p>
                          <p className="text-xs font-medium mt-0.5">৳{item.line_total.amount.toLocaleString("en-BD")}</p>
                        </div>
                        <div className="flex items-start gap-1">
                          <button
                            onClick={() => { if (item.qty <= 1) remove(item.id); else updateQty(item.id, item.qty - 1); }}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-[#e5dfd9] hover:bg-black/5 transition"
                          >
                            {item.qty <= 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          </button>
                          <span className="w-5 text-center text-xs font-medium">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-[#e5dfd9] hover:bg-black/5 transition"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-black/5 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#8a8a8a]">Subtotal</span>
                      <span>৳{subtotal.toLocaleString("en-BD")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8a8a8a]">Shipping</span>
                      <span>
                        {freeShipping ? (
                          <span className="text-emerald-600">Free</span>
                        ) : (
                          <>৳{shippingFee.toLocaleString("en-BD")}</>
                        )}
                      </span>
                    </div>
                    {!freeShipping && subtotal > 0 && (
                      <p className="text-xs text-[#8a8a8a]">
                        Add ৳{(3000 - subtotal).toLocaleString("en-BD")} more for free shipping
                      </p>
                    )}
                  </div>
                  <div className="border-t border-black/5 pt-4 flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>৳{total.toLocaleString("en-BD")}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] py-3.5 text-sm font-medium text-white hover:bg-[#1a1a1a]/90 transition disabled:opacity-60"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Place Order — ৳{total.toLocaleString("en-BD")}
                      </>
                    )}
                  </button>

                  <div className="hidden lg:flex items-center justify-center gap-4 text-xs text-[#8a8a8a]">
                    <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secure</span>
                    <span>SSL encrypted</span>
                    <span>256-bit</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile sticky footer */}
      {!loading && !isEmpty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e5dfd9] bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#8a8a8a]">Total</p>
              <p className="text-base font-semibold">৳{total.toLocaleString("en-BD")}</p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] py-3.5 text-sm font-medium text-white hover:bg-[#1a1a1a]/90 transition disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </span>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Place Order
                </>
              )}
            </button>
          </div>
        </div>
      )}
      <Footer />
      <MobileNav cartCount={itemCount} active="cart" />
    </div>
  );
}