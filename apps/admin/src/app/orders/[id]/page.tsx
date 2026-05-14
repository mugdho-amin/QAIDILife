"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Tag } from "@/components/Tag";
import { useOne, useUpdate, useNotification } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";

interface OrderDetailProps { params: Promise<{ id: string }> }

export default function OrderDetailPage({ params }: OrderDetailProps) {
  const router = useRouter();
  const { id } = use(params);
  const [newStatus, setNewStatus] = useState("");
  const { open } = useNotification();

  const { query } = useOne({ resource: "orders", id });
  const { mutate: updateMutate } = useUpdate();

  const order: any = query.data?.data;

  const handleSave = useCallback(() => {
    if (!order || !newStatus || newStatus === order.status) return;
    updateMutate({ resource: "orders", id, values: { status: newStatus } }, {
      onSuccess: () => { open?.({ type: "success", message: `Order status updated to ${newStatus}` }); query.refetch(); },
      onError: () => open?.({ type: "error", message: "Failed to update order" }),
    });
  }, [order, newStatus, id, updateMutate, open, query]);

  if (query.isLoading) {
    return (<AdminGate><AdminShell>
      <div className="animate-pulse space-y-6"><div className="h-8 w-64 rounded-2xl bg-mist/50" /><div className="h-64 rounded-3xl bg-mist/50" /></div>
    </AdminShell></AdminGate>);
  }

  if (!order) {
    return (<AdminGate><AdminShell><PageHeader title={`Order ${id}`} subtitle="Order not found." /></AdminShell></AdminGate>);
  }

  return (
    <AdminGate><AdminShell>
      <PageHeader title={`Order #${order.id.slice(0, 8)}`} subtitle={`Placed by ${order.phone}`}
        actions={newStatus && newStatus !== order.status ? <Button onClick={handleSave}>Save Status</Button> : undefined} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl border border-mist bg-panel p-6 shadow-panel">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">Items</h3>
          <div className="mt-4 space-y-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between border-b border-mist pb-3 text-sm">
                <div className="flex items-center gap-3">
                  {item.image ? <img src={item.image} alt={item.titleEn} className="h-12 w-9 rounded-lg border border-mist object-cover" /> : null}
                  <div><div className="font-semibold">{item.titleEn}</div><div className="text-xs text-ink/60">{item.titleBn}</div></div>
                </div>
                <div className="text-ink/70">{item.qty} × ৳{item.price?.toLocaleString("en-BD")}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-6">
          <div className="rounded-3xl border border-mist bg-panel p-6 shadow-panel">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink/60">Subtotal</span><span>৳{order.subtotal?.toLocaleString("en-BD")}</span></div>
              <div className="flex justify-between"><span className="text-ink/60">Shipping ({order.shippingZone})</span><span>৳{order.shippingFee?.toLocaleString("en-BD")}</span></div>
              <div className="border-t border-mist pt-2 flex justify-between text-base font-semibold"><span>Total</span><span>৳{order.total?.toLocaleString("en-BD")}</span></div>
            </div>
          </div>
          <div className="rounded-3xl border border-mist bg-panel p-6 shadow-panel">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">Status</h3>
            <div className="mt-4 space-y-4">
              <Tag label={order.status} variant={resolveStatus(order.status)} />
              <select value={newStatus || order.status} onChange={(e) => setNewStatus(e.target.value)} className="w-full h-11 rounded-full border border-mist bg-canvas px-4 text-sm outline-none">
                <option value="pending">Pending</option><option value="processing">Processing</option>
                <option value="paid">Paid</option><option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option><option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="rounded-3xl border border-mist bg-panel p-6 shadow-panel">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">Timeline</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-ink/60">Created</span><span>{new Date(order.createdAt).toLocaleString()}</span></div>
              {order.statuses?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between"><span className="text-ink/60">{s.status}</span><span>{new Date(s.timestamp).toLocaleString()}</span></div>
              ))}
            </div>
          </div>
          <Button variant="ghost" onClick={() => router.push("/orders")}><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Button>
        </section>
      </div>
    </AdminShell></AdminGate>
  );
}

const resolveStatus = (status: string) => {
  if (status === "paid" || status === "delivered") return "success";
  if (status === "pending" || status === "processing") return "warning";
  if (status === "failed" || status === "cancelled") return "danger";
  return "default";
};
