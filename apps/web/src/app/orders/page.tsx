"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { getApiClient } from "@/lib/api";
import { getGuestOrders, type GuestOrder } from "@/lib/guest-orders";
import { Package, ChevronDown, ChevronRight } from "lucide-react";
import type { components } from "@qaidilife/api-client";

type Order = components["schemas"]["Order"];
type Status = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  processing: "text-blue-600 bg-blue-50 border-blue-200",
  shipped: "text-violet-600 bg-violet-50 border-violet-200",
  delivered: "text-emerald-600 bg-emerald-50 border-emerald-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
};

const TABS: { key: Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

function shortId(id: string): string {
  return "#" + id.slice(0, 8).toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<(Order | GuestOrder)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Status>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    const token = typeof window !== "undefined" ? window.localStorage.getItem("qaidilife:token") : null;
    const guestOrders = getGuestOrders();
    const merged = new Map<string, Order | GuestOrder>();
    for (const g of guestOrders) merged.set(g.id, g);
    if (token) {
      getApiClient().listOrders().then((data) => {
        if (!controller.signal.aborted) {
          if (Array.isArray(data)) {
            for (const o of data as unknown as Order[]) merged.set(o.id, o);
          }
          setOrders(Array.from(merged.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          setLoading(false);
        }
      }).catch(() => {
        if (!controller.signal.aborted) {
          setOrders(Array.from(merged.values()));
          setLoading(false);
        }
      });
    } else {
      Promise.resolve().then(() => {
        if (!controller.signal.aborted) {
          setOrders(Array.from(merged.values()));
          setLoading(false);
        }
      });
    }
    return () => controller.abort();
  }, []);

  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusCount = (status: string) =>
    status === "all" ? orders.length : orders.filter((o) => o.status === status).length;

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-3xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
            <p className="mt-1 text-sm text-[#8a8a8a]">View and track your order history</p>
          </div>

          {/* Error */}
          {error && !loading && (
            <div className="mt-12 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-medium text-[#1a1a1a] underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="mt-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-[#e5dfd9] p-5 animate-pulse space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 rounded bg-black/5" />
                    <div className="h-5 w-16 rounded-full bg-black/5" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-14 w-11 rounded-lg bg-black/5" />
                    <div className="h-14 w-11 rounded-lg bg-black/5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-32 rounded bg-black/5" />
                    <div className="h-4 w-20 rounded bg-black/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Orders */}
          {!loading && !error && (
            <>
              {/* Tabs */}
              {orders.length > 0 && (
                <div className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <div className="flex gap-1 min-w-max sm:min-w-0">
                    {TABS.map((tab) => {
                      const count = statusCount(tab.key);
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap transition ${
                            activeTab === tab.key
                              ? "bg-[#1a1a1a] text-white"
                              : "text-[#8a8a8a] hover:text-[#1a1a1a] hover:bg-black/5"
                          }`}
                        >
                          {tab.label}
                          <span className="ml-1.5 opacity-60">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="mt-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/5">
                    <Package className="h-6 w-6 text-[#8a8a8a]" />
                  </div>
                  <h2 className="mt-4 text-base font-medium">No orders yet</h2>
                  <p className="mt-1 text-sm text-[#8a8a8a]">
                    {activeTab === "all"
                      ? "Your order history will appear here after your first purchase"
                      : `No orders with status "${STATUS_LABELS[activeTab]}"`}
                  </p>
                  {activeTab === "all" && (
                    <Link
                      href="/"
                      className="mt-5 inline-flex items-center rounded-xl bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-white hover:bg-[#1a1a1a]/90 transition"
                    >
                      Start shopping
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((order) => {
                    const isOpen = expanded.has(order.id);
                    return (
                      <div
                        key={order.id}
                        className="rounded-xl border border-[#e5dfd9] bg-white overflow-hidden transition"
                      >
                        {/* Order header */}
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-black/[0.02] transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={isOpen ? "text-[#1a1a1a]" : "text-[#8a8a8a]"}>
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{shortId(order.id)}</p>
                              <p className="text-xs text-[#8a8a8a] mt-0.5">{formatDate(order.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                            <span className="text-sm font-medium">৳{order.total.amount.toLocaleString("en-BD")}</span>
                          </div>
                        </button>

                        {/* Thumbnails row */}
                        <div className="px-5 pb-3 flex gap-2">
                          {order.items.slice(0, 5).map((item) => (
                            <div key={item.id} className="h-14 w-11 rounded-lg bg-black/5 overflow-hidden">
                              {item.image && <img src={item.image} alt={item.title_en} className="h-full w-full object-cover" />}
                            </div>
                          ))}
                          {order.items.length > 5 && (
                            <div className="h-14 w-11 rounded-lg bg-black/5 flex items-center justify-center text-xs text-[#8a8a8a] font-medium">
                              +{order.items.length - 5}
                            </div>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isOpen && (
                          <div className="border-t border-[#e5dfd9] px-5 py-4 space-y-5 text-sm">
                            {/* Items */}
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a8a8a] mb-3">Items</h3>
                              <div className="divide-y divide-black/5">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                                    <div className="h-16 w-12 shrink-0 rounded-lg bg-black/5 overflow-hidden">
                                      {item.image && <img src={item.image} alt={item.title_en} className="h-full w-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{item.title_en}</p>
                                      <p className="text-xs text-[#8a8a8a] mt-0.5">Qty: {item.qty} × ৳{item.unit_price.amount.toLocaleString("en-BD")}</p>
                                    </div>
                                    <p className="text-sm font-medium shrink-0">৳{item.line_total.amount.toLocaleString("en-BD")}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Delivery */}
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a8a8a] mb-3">Delivery</h3>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-[#8a8a8a]">Name:</span> {order.name}</p>
                                <p><span className="text-[#8a8a8a]">Phone:</span> {order.phone}</p>
                                {"email" in order && order.email && <p><span className="text-[#8a8a8a]">Email:</span> {order.email}</p>}
                                {"address" in order && <p><span className="text-[#8a8a8a]">Address:</span> {order.address}</p>}
                                <p><span className="text-[#8a8a8a]">Zone:</span> {order.shipping.zone.replace("_", " ")}</p>
                              </div>
                            </div>

                            {/* Payment */}
                            {"payments" in order && order.payments.length > 0 && (
                              <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a8a8a] mb-3">Payment</h3>
                                <div className="space-y-1 text-sm">
                                  {order.payments.map((p: any) => (
                                    <p key={p.id}>
                                      <span className="text-[#8a8a8a]">{p.provider}:</span>{" "}
                                      {p.status === "completed" || p.status === "paid" ? "Paid" : p.status}
                                      {p.transaction_id && <> — ID: {p.transaction_id}</>}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Pricing */}
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a8a8a] mb-3">Summary</h3>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-[#8a8a8a]">Subtotal</span>
                                  <span>৳{order.subtotal.amount.toLocaleString("en-BD")}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#8a8a8a]">Shipping</span>
                                  <span>৳{order.shipping.fee.amount.toLocaleString("en-BD")}</span>
                                </div>
                                <div className="border-t border-black/5 pt-1.5 flex justify-between font-semibold">
                                  <span>Total</span>
                                  <span>৳{order.total.amount.toLocaleString("en-BD")}</span>
                                </div>
                              </div>
                            </div>

                            {/* Order ID & date */}
                            <div className="text-xs text-[#8a8a8a] space-y-0.5">
                              <p>Order ID: {order.id}</p>
                              <p>Placed on: {formatDate(order.created_at)} at {formatTime(order.created_at)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <MobileNav cartCount={0} active="cart" />
    </div>
  );
}