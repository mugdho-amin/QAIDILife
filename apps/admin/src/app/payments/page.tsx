"use client";

import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Tag } from "@/components/Tag";
import { useList } from "@refinedev/core";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/export";

export default function PaymentsPage() {
  const { query } = useList({ resource: "payments" });
  const payments = (query.data?.data ?? []) as any[];

  const handleExport = () => {
    exportToCSV(payments.map((p: any) => ({ ID: p.id, Provider: p.provider, Amount: p.amount, Status: p.status, Transaction: p.transactionId ?? "", Created: p.createdAt })), "payments");
  };

  const rows = payments.map((payment: any) => (
    <div key={payment.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm items-center">
      <div className="col-span-3 font-mono text-xs font-semibold">{payment.id.slice(0, 8)}...</div>
      <div className="col-span-2 text-ink/70">{payment.provider}</div>
      <div className="col-span-2 text-ink/70">৳{payment.amount?.toLocaleString("en-BD")}</div>
      <div className="col-span-3"><Tag label={payment.status} variant={resolveStatus(payment.status)} /></div>
      <div className="col-span-2 text-right text-xs text-ink/60 font-mono">{payment.transactionId ? payment.transactionId.slice(0, 12) : "—"}</div>
    </div>
  ));

  return (
    <AdminGate><AdminShell>
      <PageHeader title="Payments" subtitle="Track gateway sessions, settlements, and failures."
        actions={<Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export CSV</Button>} />
      <div className="mt-8">
        {query.isLoading ? (
          <div className="space-y-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-3xl bg-mist/50" />)}</div>
        ) : payments.length === 0 ? (
          <EmptyState title="No payments yet" description="Payment sessions will appear here once orders are placed." />
        ) : (
          <DataTable columns={[{ label: "Payment ID", width: "col-span-3" }, { label: "Provider", width: "col-span-2" }, { label: "Amount", width: "col-span-2" }, { label: "Status", width: "col-span-3" }, { label: "Txn ID", width: "col-span-2" }]} rows={rows} />
        )}
      </div>
    </AdminShell></AdminGate>
  );
}

const resolveStatus = (status: string) => {
  if (status === "paid" || status === "success") return "success";
  if (status === "pending" || status === "initiated") return "warning";
  if (status === "failed" || status === "cancelled") return "danger";
  return "default";
};
