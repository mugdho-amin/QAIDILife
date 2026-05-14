"use client";

import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Tag } from "@/components/Tag";
import { useList, useDelete, useNotification } from "@refinedev/core";
import { Search, Trash2, Plus } from "lucide-react";
import { useState } from "react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const { mutate } = useDelete();
  const { open } = useNotification();

  const { query } = useList({
    resource: "catalog/products",
    pagination: { currentPage: 1, pageSize: 100 },
    filters: search ? [{ field: "q", operator: "contains", value: search }] : undefined,
  });

  const products = query.data?.data ?? [];

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    mutate(
      { resource: "catalog/products", id },
      {
        onSuccess: () => { open?.({ type: "success", message: "Product deleted" }); query.refetch(); },
        onError: () => { open?.({ type: "error", message: "Failed to delete product" }); },
      },
    );
  };

  if (query.isError) {
    return (
      <AdminGate><AdminShell>
        <PageHeader title="Products" subtitle="Curate the storefront catalog." />
        <div className="mt-8 rounded-3xl border border-danger/20 bg-danger/5 p-6 text-center">
          <p className="text-sm text-danger">Failed to load products: {(query.error as unknown as Error)?.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => query.refetch()}>Retry</Button>
        </div>
      </AdminShell></AdminGate>
    );
  }

  const rows = (products as any[]).map((product: any) => (
    <div key={product.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm items-center">
      <div className="col-span-4 flex items-center gap-3">
        {product.primaryImage ? <img src={product.primaryImage} alt={product.titleEn} className="h-10 w-8 rounded-lg border border-mist object-cover" /> : null}
        <div>
          <div className="font-semibold">{product.titleEn}</div>
          <div className="text-xs text-ink/60">{product.slug}</div>
        </div>
      </div>
      <div className="col-span-2 text-ink/70">৳{product.price?.toLocaleString("en-BD")}</div>
      <div className="col-span-2 text-ink/70">{product.variants?.length ?? 0} variants</div>
      <div className="col-span-2"><Tag label="Active" variant="success" /></div>
      <div className="col-span-2 flex justify-end gap-2">
        <Link href={`/products/${product.id}`} className="text-xs uppercase tracking-[0.2em] text-ink/70 hover:text-ink">Edit</Link>
        <button onClick={() => handleDelete(product.id, product.titleEn)} className="text-danger/60 hover:text-danger" aria-label={`Delete ${product.titleEn}`}><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  ));

  return (
    <AdminGate><AdminShell>
      <PageHeader title="Products" subtitle="Curate the storefront catalog and variant inventory."
        actions={<Link href="/products/new"><Button><Plus className="mr-2 h-4 w-4" />Create Product</Button></Link>} />
      <div className="mt-6 flex items-center gap-3 rounded-full border border-mist bg-panel px-4 py-2 text-sm shadow-panel max-w-md">
        <Search className="h-4 w-4 text-ink/40" />
        <input type="search" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
      </div>
      <div className="mt-6">
        {query.isLoading ? (
          <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 animate-pulse rounded-3xl bg-mist/50" />)}</div>
        ) : products.length === 0 ? (
          <EmptyState title={search ? "No matching products" : "No products yet"} description={search ? "Try a different search term." : "Create your first product to get the catalog live."}
            action={<Link href="/products/new"><Button>Create Product</Button></Link>} />
        ) : (
          <DataTable columns={[{ label: "Product", width: "col-span-4" }, { label: "Price", width: "col-span-2" }, { label: "Variants", width: "col-span-2" }, { label: "Status", width: "col-span-2" }, { label: "Actions", width: "col-span-2" }]} rows={rows} />
        )}
      </div>
    </AdminShell></AdminGate>
  );
}
