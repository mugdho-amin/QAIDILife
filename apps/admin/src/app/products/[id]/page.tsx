"use client";

import { use, useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { useOne, useCreate, useUpdate, useList, useNotification } from "@refinedev/core";
import { Plus, Trash2, Upload, X, Check, WandSparkles } from "lucide-react";

interface ProductEditorProps { params: Promise<{ id: string }> }

interface VariantForm { sku: string; size: string; color: string; stock: number | null; price: number | null }
interface ProductForm {
  titleEn: string; titleBn: string; slug: string;
  descriptionEn: string; descriptionBn: string;
  primaryImage: string; gallery: string[];
  price: number | null; compareAt?: number | null; currency: string;
  variants: VariantForm[]; categoryIds: string[];
}

const emptyVariant = (): VariantForm => ({ sku: "", size: "", color: "", stock: null, price: null });
const emptyForm: ProductForm = { titleEn: "", titleBn: "", slug: "", descriptionEn: "", descriptionBn: "", primaryImage: "", gallery: [], price: null, compareAt: null, currency: "BDT", variants: [emptyVariant()], categoryIds: [] };

export default function ProductEditorPage({ params }: ProductEditorProps) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === "new";
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { open } = useNotification();
  const { query: productQuery } = useOne({ resource: "catalog/products", id, queryOptions: { enabled: !isNew } });
  const { query: categoriesQuery } = useList({ resource: "catalog/categories" });
  const categories = (categoriesQuery.data?.data ?? []) as any[];

  const { mutate: createMutate } = useCreate();
  const { mutate: updateMutate } = useUpdate();

  useEffect(() => {
    if (!isNew && productQuery.data?.data) {
      const product: any = productQuery.data.data;
      slugManuallyEdited.current = true;
      setForm({
        titleEn: product.titleEn ?? "",
        titleBn: product.titleBn ?? "",
        slug: product.slug ?? "",
        descriptionEn: product.descriptionEn ?? "",
        descriptionBn: product.descriptionBn ?? "",
        primaryImage: product.primaryImage ?? "",
        gallery: product.gallery ?? [],
        price: product.price ?? null,
        compareAt: product.compareAt ?? null,
        currency: product.currency ?? "BDT",
        variants: (product.variants ?? []).map((v: any) => ({
          sku: v.sku ?? "", size: v.size ?? "", color: v.color ?? "",
          stock: v.stock ?? null, price: v.price ?? null,
        })),
        categoryIds: (product.categories ?? []).map((c: any) => c.id ?? c.category?.id).filter(Boolean),
      });
    }
  }, [isNew, productQuery.data]);

  const slugManuallyEdited = useRef(false);
  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

  const handleTitleChange = (value: string) => {
    updateField("titleEn", value);
    if (!slugManuallyEdited.current) {
      updateField("slug", slugify(value));
    }
  };

  const handleSlugFocus = () => { slugManuallyEdited.current = true; };
  const handleSlugBlur = (value: string) => {
    if (!value.trim()) { slugManuallyEdited.current = false; }
  };

  const parseFieldErrors = (err: any) => {
    const errors: Record<string, string> = {};
    const messages = err?.message;
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const colonIdx = msg.indexOf(":");
        if (colonIdx > 0) {
          const field = msg.slice(0, colonIdx).trim();
          const text = msg.slice(colonIdx + 1).trim();
          if (field) errors[field] = text;
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
    }
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateField = (key: keyof ProductForm, value: any) => {
    clearFieldError(key);
    setForm((p) => ({ ...p, [key]: value }));
  };

  const handleFileUpload = (key: "primaryImage" | "gallery", file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (key === "primaryImage") {
        updateField("primaryImage", dataUrl);
      } else {
        updateField("gallery", [...form.gallery, dataUrl]);
      }
      open?.({ type: "success", message: "Image uploaded" });
    };
    reader.onerror = () => open?.({ type: "error", message: "Failed to read file" });
    reader.readAsDataURL(file);
  };
  const updateVariant = (index: number, key: keyof VariantForm, value: string | number | null) => {
    clearFieldError(`variants.${index}.${key}`);
    setForm((p) => {
      const next = p.variants.map((v, i) => (i === index ? { ...v, [key]: value } : v));
      return { ...p, variants: next };
    });
  };
  const addVariant = () => setForm((p) => ({ ...p, variants: [...p.variants, emptyVariant()] }));
  const removeVariant = (index: number) => setForm((p) => {
    const next = p.variants.filter((_, i) => i !== index);
    return { ...p, variants: next.length ? next : [emptyVariant()] };
  });
  const toggleCategory = (categoryId: string) => setForm((p) => ({
    ...p, categoryIds: p.categoryIds.includes(categoryId) ? p.categoryIds.filter((id) => id !== categoryId) : [...p.categoryIds, categoryId],
  }));

  const generateSku = (size: string, color: string): string => {
    const prefix = "QA";
    const sizeCode = size ? size.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2) : "OS";
    const colorCode = color ? color.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) : "XX";
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${sizeCode}-${colorCode}-${rand}`;
  };

  const generateAllSkus = () => {
    setForm((p) => ({
      ...p,
      variants: p.variants.map((v) => ({
        ...v,
        sku: generateSku(v.size, v.color),
      })),
    }));
    open?.({ type: "success", message: "SKUs generated" });
  };

  const generateSingleSku = (index: number) => {
    setForm((p) => {
      const v = p.variants[index];
      const next = [...p.variants];
      next[index] = { ...v, sku: generateSku(v.size, v.color) };
      return { ...p, variants: next };
    });
  };

  const handleSave = () => {
    if (!form.titleEn || !form.slug) { open?.({ type: "error", message: "Title (English) and Slug are required" }); return; }
    setFieldErrors({});
    const values = { ...form };
    if (isNew) {
      createMutate({ resource: "catalog/products", values }, {
        onSuccess: () => router.push("/products"),
        onError: parseFieldErrors,
      });
    } else {
      updateMutate({ resource: "catalog/products", id, values }, {
        onSuccess: () => router.push("/products"),
        onError: parseFieldErrors,
      });
    }
  };

  const categoryBadges = useMemo(() =>
    categories.map((category: any) => (
      <button key={category.id} type="button" onClick={() => toggleCategory(category.id)}
        className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${form.categoryIds.includes(category.id) ? "border-ink bg-ink text-canvas" : "border-mist text-ink/70 hover:border-ink/30"}`}>
        {category.nameEn}
      </button>
    )), [categories, form.categoryIds]);

  return (
    <AdminGate><AdminShell>
      <PageHeader title={isNew ? "Create Product" : "Edit Product"} subtitle="Keep product details, imagery, and variants aligned."
        actions={<div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/products")}><X className="h-3.5 w-3.5 mr-1.5" />Cancel</Button>
          <Button onClick={handleSave}><Check className="h-3.5 w-3.5 mr-1.5" />Save</Button>
        </div>} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr] w-full">
        <section className="space-y-5 rounded-2xl border border-mist bg-panel p-5 lg:p-6 shadow-sm min-w-0 overflow-hidden">
          <div className="grid gap-5">
            <Input label="Title (English)" value={form.titleEn} onChange={(e) => handleTitleChange(e.target.value)} error={fieldErrors["titleEn"]} />
            <Input label="Title (Bengali)" value={form.titleBn} onChange={(e) => updateField("titleBn", e.target.value)} error={fieldErrors["titleBn"]} />
            <Input label="Slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} onFocus={handleSlugFocus} onBlur={(e) => handleSlugBlur(e.target.value)} error={fieldErrors["slug"]} />
          </div>
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-text-muted font-medium">
            Description (English)
            <textarea value={form.descriptionEn} onChange={(e) => { clearFieldError("descriptionEn"); updateField("descriptionEn", e.target.value); }} className={`min-h-[100px] rounded-xl border p-3 text-base sm:text-sm text-ink outline-none resize-y transition-all duration-200 focus:ring-1 ${fieldErrors["descriptionEn"] ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5" : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"}`} />
            {fieldErrors["descriptionEn"] && <span className="text-xs text-danger">{fieldErrors["descriptionEn"]}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-text-muted font-medium">
            Description (Bengali)
            <textarea value={form.descriptionBn} onChange={(e) => { clearFieldError("descriptionBn"); updateField("descriptionBn", e.target.value); }} className={`min-h-[100px] rounded-xl border p-3 text-base sm:text-sm text-ink outline-none resize-y transition-all duration-200 focus:ring-1 ${fieldErrors["descriptionBn"] ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5" : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"}`} />
            {fieldErrors["descriptionBn"] && <span className="text-xs text-danger">{fieldErrors["descriptionBn"]}</span>}
          </label>
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium">Primary Image</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={form.primaryImage} onChange={(e) => updateField("primaryImage", e.target.value)} placeholder="https://cdn.qaidilife.com/images/product.jpg" className="flex-1" error={fieldErrors["primaryImage"]} />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-mist bg-canvas px-4 py-3 text-sm text-text-muted hover:bg-accent-soft transition shrink-0">
                <Upload className="h-4 w-4" />
                <span>Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload("primaryImage", f); e.target.value = ""; }} />
              </label>
            </div>
            {form.primaryImage && (
              <div className="relative inline-block group">
                <img src={form.primaryImage} alt="Primary" className="h-20 w-16 rounded-lg border border-mist object-cover" />
                <button onClick={() => updateField("primaryImage", "")} className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-xs opacity-0 group-hover:opacity-100 transition">×</button>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium">Gallery Images</label>
            {form.gallery.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.gallery.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Gallery ${i}`} className="h-16 w-12 rounded-lg border border-mist object-cover" />
                    <button onClick={() => { const next = form.gallery.filter((_, j) => j !== i); updateField("gallery", next); }} className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white text-[10px] opacity-0 group-hover:opacity-100 transition">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { const url = prompt("Enter image URL:"); if (url) updateField("gallery", [...form.gallery, url]); }} className="rounded-xl border border-dashed border-mist px-3 py-2 text-xs text-text-muted hover:text-ink hover:border-ink/30 transition">+ Add URL</button>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-mist px-3 py-2 text-xs text-text-muted hover:text-ink hover:border-ink/30 transition">
                <Upload className="h-3.5 w-3.5" />
                Upload Files
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const files = e.target.files; if (files) Array.from(files).forEach((f) => handleFileUpload("gallery", f)); e.target.value = ""; }} />
              </label>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Price (BDT)" type="number" value={form.price ?? ""} onChange={(e) => updateField("price", e.target.value ? Number(e.target.value) : null)} placeholder="0" error={fieldErrors["price"]} />
            <Input label="Compare At" type="number" value={form.compareAt ?? ""} onChange={(e) => updateField("compareAt", e.target.value ? Number(e.target.value) : null)} placeholder="0" />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium">Currency</span>
              <select value={form.currency} onChange={(e) => updateField("currency", e.target.value)} className="rounded-xl border border-mist bg-canvas px-4 py-3 text-base sm:text-sm text-ink outline-none transition-all duration-200 focus:border-ink/30 focus:ring-1 focus:ring-ink/10">
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </label>
          </div>
        </section>
        <section className="space-y-5 min-w-0 overflow-hidden">
          <div className="rounded-2xl border border-mist bg-panel p-5 lg:p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">Categories</h3>
            <div className="mt-4 flex flex-wrap gap-2">{categoryBadges}</div>
          </div>
          <div className="rounded-2xl border border-mist bg-panel p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">Variants ({form.variants.length})</h3>
              <Button variant="outline" size="sm" onClick={addVariant}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
            </div>
            <div className="mt-4 space-y-3">
              {form.variants.map((variant, index) => (
                <div key={index} className="rounded-xl border border-mist bg-canvas p-3 lg:p-5">
                  <div className="space-y-3">
                      <div>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium">SKU</span>
                        <div className="relative">
                          <input value={variant.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} placeholder="QA-..." className={`w-full rounded-xl border px-4 py-3 pr-10 text-base sm:text-sm text-ink outline-none transition-all duration-200 placeholder:text-text-muted/50 focus:ring-1 ${fieldErrors[`variants.${index}.sku`] ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5" : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"}`} />
                          <button onClick={() => generateSingleSku(index)} className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent-soft transition" title="Generate SKU">
                            <WandSparkles className="h-3.5 w-3.5 text-text-muted" />
                          </button>
                        </div>
                        {fieldErrors[`variants.${index}.sku`] && <span className="text-xs text-danger">{fieldErrors[`variants.${index}.sku`]}</span>}
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Size" value={variant.size} onChange={(e) => updateVariant(index, "size", e.target.value)} error={fieldErrors[`variants.${index}.size`]} />
                      <Input label="Color" value={variant.color} onChange={(e) => updateVariant(index, "color", e.target.value)} error={fieldErrors[`variants.${index}.color`]} />
                      <Input label="Stock" type="number" value={variant.stock ?? ""} onChange={(e) => updateVariant(index, "stock", e.target.value ? Number(e.target.value) : null)} placeholder="0" error={fieldErrors[`variants.${index}.stock`]} />
                      <Input label="Price" type="number" value={variant.price ?? ""} onChange={(e) => updateVariant(index, "price", e.target.value ? Number(e.target.value) : null)} placeholder="0" error={fieldErrors[`variants.${index}.price`]} />
                    </div>
                  </div>
                  {form.variants.length > 1 && (
                    <div className="mt-2 flex justify-end">
                      <button onClick={() => removeVariant(index)} className="flex items-center gap-1 text-xs text-danger/60 hover:text-danger transition px-2 py-1 rounded-lg hover:bg-danger/5">
                        <Trash2 className="h-3 w-3" />Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AdminShell></AdminGate>
  );
}
