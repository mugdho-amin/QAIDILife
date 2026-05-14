"use client";

import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { useList, useCreate, useUpdate, useNotification } from "@refinedev/core";
import { useState } from "react";

export default function CategoriesPage() {
  const [draft, setDraft] = useState({ nameEn: "", nameBn: "", slug: "" });
  const { open } = useNotification();
  const { query } = useList({ resource: "catalog/categories" });
  const { mutate: createMutate } = useCreate();
  const { mutate: updateMutate } = useUpdate();

  const categories = (query.data?.data ?? []) as any[];

  const handleCreate = () => {
    if (!draft.nameEn || !draft.slug) { open?.({ type: "error", message: "Name (English) and Slug are required" }); return; }
    createMutate({ resource: "catalog/categories", values: draft }, {
      onSuccess: () => { setDraft({ nameEn: "", nameBn: "", slug: "" }); query.refetch(); open?.({ type: "success", message: "Category created" }); },
      onError: () => open?.({ type: "error", message: "Failed to create category" }),
    });
  };

  const handleInlineUpdate = (id: string, field: string, value: string) => {
    updateMutate({ resource: "catalog/categories", id, values: { [field]: value } }, {
      onSuccess: () => { query.refetch(); open?.({ type: "success", message: "Category updated" }); },
      onError: () => open?.({ type: "error", message: "Failed to update category" }),
    });
  };

  const rows = categories.map((category: any) => (
    <div key={category.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm">
      <div className="col-span-4">
        <input className="w-full bg-transparent text-sm font-semibold outline-none" defaultValue={category.nameEn}
          onBlur={(e) => { if (e.target.value !== category.nameEn) handleInlineUpdate(category.id, "nameEn", e.target.value); }} />
        <div className="text-xs text-ink/60">{category.slug}</div>
      </div>
      <div className="col-span-4 text-ink/70">
        <input className="w-full bg-transparent text-sm outline-none" defaultValue={category.nameBn}
          onBlur={(e) => { if (e.target.value !== category.nameBn) handleInlineUpdate(category.id, "nameBn", e.target.value); }} />
      </div>
      <div className="col-span-4 text-right">
        <input className="w-full text-right bg-transparent text-sm outline-none text-ink/60" defaultValue={category.slug}
          onBlur={(e) => { if (e.target.value !== category.slug) handleInlineUpdate(category.id, "slug", e.target.value); }} />
      </div>
    </div>
  ));

  return (
    <AdminGate><AdminShell>
      <PageHeader title="Categories" subtitle="Manage product grouping and navigation." actions={<Button onClick={handleCreate}>Create Category</Button>} />
      <section className="mt-6 rounded-3xl border border-mist bg-panel p-6 shadow-panel">
        <div className="grid gap-4 lg:grid-cols-3">
          <Input label="Name (English)" value={draft.nameEn} onChange={(e) => setDraft((p) => ({ ...p, nameEn: e.target.value }))} />
          <Input label="Name (Bengali)" value={draft.nameBn} onChange={(e) => setDraft((p) => ({ ...p, nameBn: e.target.value }))} />
          <Input label="Slug" value={draft.slug} onChange={(e) => setDraft((p) => ({ ...p, slug: e.target.value }))} />
        </div>
      </section>
      <div className="mt-8">
        {query.isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-3xl bg-mist/50" />)}</div>
        ) : categories.length === 0 ? (
          <EmptyState title="No categories yet" description="Create categories to organize the catalog." />
        ) : (
          <DataTable columns={[{ label: "Category", width: "col-span-4" }, { label: "Bengali Name", width: "col-span-4" }, { label: "Slug", width: "col-span-4" }]} rows={rows} />
        )}
      </div>
    </AdminShell></AdminGate>
  );
}
