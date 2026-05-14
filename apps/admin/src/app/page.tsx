"use client";

import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Skeleton } from "@/components/Skeleton";
import { useCustom } from "@refinedev/core";
import {
  Package,
  ShoppingCart,
  Clock,
  BanknoteIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Users,
} from "lucide-react";

const fallbackMetrics = { productCount: 0, orderCount: 0, pendingOrders: 0, totalRevenue: 0, revenueGrowth: 0, lowStockItems: 0, todayOrders: 0, activeUsers: 0 };

export default function AdminDashboardPage() {
  const { query } = useCustom({ url: "/v1/admin/metrics", method: "get" });
  const metrics = query.data?.data ?? fallbackMetrics;
  const isLoading = query.isLoading;

  const statCards = [
    {
      label: "Total Revenue",
      value: `৳${metrics.totalRevenue.toLocaleString("en-BD")}`,
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

  const recentActivity = [
    { action: "New order placed", detail: "#ORD-2024-0042", time: "2 minutes ago", type: "order" },
    { action: "Product updated", detail: "Classic Panjabi White", time: "15 minutes ago", type: "product" },
    { action: "Payment received", detail: "৳3,200 via bKash", time: "1 hour ago", type: "payment" },
    { action: "Order delivered", detail: "#ORD-2024-0039", time: "2 hours ago", type: "order" },
    { action: "Low stock alert", detail: "Cotton Polo Navy (Size L)", time: "3 hours ago", type: "alert" },
  ];

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
          <div className="lg:col-span-2 rounded-2xl border border-mist bg-panel p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">Recent Activity</h3>
              <button className="text-xs text-text-muted hover:text-ink transition">View all</button>
            </div>
            <div className="space-y-0">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 border-b border-mist/50 last:border-0 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    item.type === "order" ? "bg-blue-50 text-blue-600" :
                    item.type === "payment" ? "bg-emerald-50 text-emerald-600" :
                    item.type === "alert" ? "bg-amber-50 text-amber-600" :
                    "bg-violet-50 text-violet-600"
                  )}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{item.action}</p>
                    <p className="text-xs text-text-muted truncate">{item.detail}</p>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-mist bg-panel p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Pending Orders</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{isLoading ? "—" : metrics.pendingOrders}</span>
                    <span className="flex items-center gap-0.5 text-xs text-amber-600">
                      <ArrowUpRight className="h-3 w-3" />
                      12%
                    </span>
                  </div>
                </div>
                <div className="h-px bg-mist/50" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Low Stock Items</span>
                  <span className="text-sm font-semibold">{isLoading ? "—" : metrics.lowStockItems}</span>
                </div>
                <div className="h-px bg-mist/50" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Revenue Growth</span>
                  <span className={`text-sm font-semibold ${metrics.revenueGrowth >= 0 ? "text-emerald-600" : "text-danger"}`}>
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
