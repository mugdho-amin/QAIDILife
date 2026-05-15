"use client";

import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useCustom } from "@refinedev/core";
import type { AdminRecentOrder } from "@/lib/types";
import {
  Package,
  ShoppingCart,
  BanknoteIcon,
  Activity,
  Users,
} from "lucide-react";

const fallbackMetrics = { productCount: 0, orderCount: 0, pendingOrders: 0, totalRevenue: 0, revenueGrowth: 0, lowStockItems: 0, todayOrders: 0, activeUsers: 0, recentOrders: [] };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const statusAction: Record<string, string> = {
  pending: "New order placed",
  paid: "Payment received",
  delivered: "Order delivered",
  cancelled: "Order cancelled",
};

export default function AdminDashboardPage() {
  const { query } = useCustom({ url: "/v1/admin/metrics", method: "get" });
  const metrics = query.data?.data ?? fallbackMetrics;
  const isLoading = query.isLoading;

  const statCards = [
    {
      label: "Total Revenue",
      value: `৳${(metrics.totalRevenue / 100).toLocaleString("en-BD")}`,
      hint: `${metrics.revenueGrowth >= 0 ? "+" : ""}${metrics.revenueGrowth ?? 0}% vs last month`,
      icon: BanknoteIcon,
      trend: metrics.revenueGrowth >= 0 ? "up" : "down",
      color: "text-emerald-600",
    },
    {
      label: "Products",
      value: metrics.productCount.toLocaleString(),
      hint: `${metrics.lowStockItems ?? 0} low in stock`,
      icon: Package,
      trend: "neutral",
      color: "text-blue-600",
    },
    {
      label: "Orders Today",
      value: metrics.todayOrders?.toLocaleString() ?? "0",
      hint: `${metrics.pendingOrders ?? 0} pending fulfillment`,
      icon: ShoppingCart,
      trend: "neutral",
      color: "text-violet-600",
    },
    {
      label: "Active Users",
      value: metrics.activeUsers?.toLocaleString() ?? "—",
      hint: "Unique this month",
      icon: Users,
      trend: "neutral",
      color: "text-amber-600",
    },
  ];

  const activities = (metrics.recentOrders ?? []).flatMap((order: AdminRecentOrder) => [
    {
      action: statusAction[order.status] ?? "Order updated",
      detail: `#${order.id.slice(0, 8)} · ${order.item?.titleEn ?? ""}`,
      time: timeAgo(order.createdAt),
      type: order.status === "delivered" ? "delivered" : "order" as const,
    },
  ]);

  return (
    <AdminGate>
      <AdminShell>
        <PageHeader
          title="Dashboard"
          subtitle="Real-time overview of your commerce operations"
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={isLoading ? "—" : card.value}
              hint={isLoading ? undefined : card.hint}
              icon={<card.icon className={`h-5 w-5 ${card.color}`} />}
              trend={card.trend as "up" | "down" | "neutral"}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-panel">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">Recent Activity</h3>
              <button className="text-xs text-muted-foreground hover:text-foreground transition">View all</button>
            </div>
            <div className="space-y-0">
              {activities.map((item: { action: string; detail: string; time: string; type: string }, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    item.type === "delivered" ? "bg-emerald-50 text-emerald-600" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
              {activities.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground py-3 text-center">No recent orders</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-panel">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Orders</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{isLoading ? "—" : metrics.pendingOrders}</span>
                  </div>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Low Stock Items</span>
                  <span className="text-sm font-semibold">{isLoading ? "—" : metrics.lowStockItems}</span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue Growth</span>
                  <span className={`text-sm font-semibold ${metrics.revenueGrowth >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {isLoading ? "—" : `${metrics.revenueGrowth >= 0 ? "+" : ""}${metrics.revenueGrowth ?? 0}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminGate>
  );
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}
