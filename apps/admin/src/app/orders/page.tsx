"use client";

import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Tag } from "@/components/Tag";
import { Button } from "@/components/Button";
import { useList, useNotification } from "@refinedev/core";
import { Search, Download } from "lucide-react";
import { useState, useCallback } from "react";
import { exportToCSV } from "@/lib/export";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { open } = useNotification();

  const filters: any[] = [];
  if (search) filters.push({ field: "q", operator: "contains", value: search });
  if (statusFilter) filters.push({ field: "status", operator: "eq", value: statusFilter });

  const { query } = useList({ resource: "orders", pagination: { currentPage: 1, pageSize: 100 }, filters: filters.length ? filters : undefined });
  const orders = (query.data?.data ?? []) as any[];

  const exportCSV = useCallback(() => {
    if (!orders.length) return;
    exportToCSV(orders.map((o: any) => ({ ID: o.id, Phone: o.phone, Subtotal: o.subtotal, Shipping: o.shippingFee, Total: o.total, Status: o.status, Date: o.createdAt })), "orders");
    open?.({ type: "success", message: "Orders exported" });
  }, [orders, open]);

  if (query.isError) {
    return (
      <AdminGate><AdminShell>
        <PageHeader title="Orders" subtitle="Track fulfillment and payment status." />
        <div className="mt-8 rounded-3xl border border-danger/20 bg-danger/5 p-6 text-center">
          <p className="text-sm text-danger">Failed to load orders: {(query.error as unknown as Error)?.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => query.refetch()}>Retry</Button>
        </div>
      </AdminShell></AdminGate>
    );
  }

  const rows = orders.map((order: any) => (
    <div key={order.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm items-center">
      <div className="col-span-3 font-mono text-xs font-semibold">{order.id.slice(0, 8)}...</div>
      <div className="col-span-2 text-ink/70">{order.phone}</div>
      <div className="col-span-2 text-ink/70">৳{order.total?.toLocaleString("en-BD")}</div>
      <div className="col-span-3"><Tag label={order.status} variant={resolveStatus(order.status)} /></div>
      <div className="col-span-2 text-right"><Link href={`/orders/${order.id}`} className="text-xs uppercase tracking-[0.2em] text-ink/70 hover:text-ink">View</Link></div>
    </div>
  ));

  return (
    <AdminGate><AdminShell>
      <PageHeader title="Orders" subtitle="Track fulfillment and payment status across all orders."
        actions={<Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button>} />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-mist bg-panel px-4 py-2 text-sm shadow-panel max-w-md flex-1">
          <Search className="h-4 w-4 text-ink/40" />
          <input type="search" placeholder="Search by phone or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-full border border-mist bg-panel px-4 text-sm outline-none">
          <option value="">All Status</option>
          <option value="pending">Pending</option><option value="processing">Processing</option>
          <option value="paid">Paid</option><option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option><option value="failed">Failed</option>
        </select>
      </div>
      <div className="mt-6">
        {query.isLoading ? (
          <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 animate-pulse rounded-3xl bg-mist/50" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Orders will appear here once customers check out." />
        ) : (
          <DataTable columns={[{ label: "Order ID", width: "col-span-3" }, { label: "Phone", width: "col-span-2" }, { label: "Total", width: "col-span-2" }, { label: "Status", width: "col-span-3" }, { label: "Action", width: "col-span-2" }]} rows={rows} />
        )}
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
