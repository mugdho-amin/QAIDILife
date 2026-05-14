"use client";

import { use, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { useOne, useCreate, useUpdate, useList, useNotification } from "@refinedev/core";
import {
  Plus, Trash2, Upload, X, Check, WandSparkles, GripVertical,
  Copy, ChevronDown, ChevronUp, Image, Package, AlertTriangle,
  Eye, EyeOff, Search, List, Grid3X3, ArrowUpDown, Tags,
} from "lucide-react";

interface ProductEditorProps { params: Promise<{ id: string }> }

interface VariantForm {
  sku: string; size: string; color: string; stock: number | null; price: number | null;
  compareAt: number | null; image: string; weight: number | null; barcode: string;
  lowStockThreshold: number; enabled: boolean; sortOrder: number;
}
interface ProductForm {
  titleEn: string; titleBn: string; slug: string;
  descriptionEn: string; descriptionBn: string;
  primaryImage: string; gallery: string[];
  price: number | null; compareAt?: number | null; currency: string;
  variants: VariantForm[]; categoryIds: string[];
}

const emptyVariant = (sortOrder = 0): VariantForm => ({
  sku: "", size: "", color: "", stock: null, price: null,
  compareAt: null, image: "", weight: null, barcode: "",
  lowStockThreshold: 5, enabled: true, sortOrder,
});
const emptyForm: ProductForm = {
  titleEn: "", titleBn: "", slug: "", descriptionEn: "", descriptionBn: "",
  primaryImage: "", gallery: [], price: null, compareAt: null, currency: "BDT",
  variants: [emptyVariant(0)], categoryIds: [],
};

export default function ProductEditorPage({ params }: ProductEditorProps) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === "new";
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(new Set([0]));
  const [variantSearch, setVariantSearch] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [matrixSizes, setMatrixSizes] = useState("");
  const [matrixColors, setMatrixColors] = useState("");
  const { open } = useNotification();
  const { query: productQuery } = useOne({ resource: "catalog/products", id, queryOptions: { enabled: !isNew } });
  const { query: categoriesQuery } = useList({ resource: "catalog/categories" });
  const categories = (categoriesQuery.data?.data ?? []) as any[];
  const variantContainerRef = useRef<HTMLDivElement>(null);

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
        variants: (product.variants ?? []).map((v: any, i: number) => ({
          sku: v.sku ?? "", size: v.size ?? "", color: v.color ?? "",
          stock: v.stock ?? null, price: v.price ?? null,
          compareAt: v.compareAt ?? null, image: v.image ?? "",
          weight: v.weight ?? null, barcode: v.barcode ?? "",
          lowStockThreshold: v.lowStockThreshold ?? 5,
          enabled: v.enabled ?? true, sortOrder: v.sortOrder ?? i,
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

  const updateVariant = (index: number, key: keyof VariantForm, value: string | number | boolean | null) => {
    clearFieldError(`variants.${index}.${key}`);
    setForm((p) => {
      const next = p.variants.map((v, i) => (i === index ? { ...v, [key]: value } : v));
      return { ...p, variants: next };
    });
  };

  const addVariant = () => {
    const idx = form.variants.length;
    setForm((p) => ({ ...p, variants: [...p.variants, emptyVariant(idx)] }));
    setExpandedVariants((prev) => new Set(prev).add(idx));
    setTimeout(() => {
      variantContainerRef.current?.scrollTo({ top: variantContainerRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const removeVariant = (index: number) => {
    setForm((p) => {
      const next = p.variants.filter((_, i) => i !== index).map((v, i) => ({ ...v, sortOrder: i }));
      return { ...p, variants: next.length ? next : [emptyVariant(0)] };
    });
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      next.delete(index);
      const adjusted = new Set<number>();
      for (const v of next) {
        adjusted.add(v > index ? v - 1 : v);
      }
      return adjusted;
    });
  };

  const duplicateVariant = (index: number) => {
    const idx = form.variants.length;
    setForm((p) => {
      const source = p.variants[index];
      const clone = { ...source, sku: "", sortOrder: idx };
      return { ...p, variants: [...p.variants, clone] };
    });
    setExpandedVariants((prev) => new Set(prev).add(idx));
  };

  const toggleVariantExpand = (index: number) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleCategory = (categoryId: string) => setForm((p) => ({
    ...p, categoryIds: p.categoryIds.includes(categoryId)
      ? p.categoryIds.filter((id) => id !== categoryId)
      : [...p.categoryIds, categoryId],
  }));

  const generateSku = (size: string, color: string, index: number): string => {
    const prefix = "QA";
    const sizeCode = size ? size.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2) : "OS";
    const colorCode = color ? color.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) : "XX";
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${sizeCode}-${colorCode}-${rand}`;
  };

  const generateSingleSku = (index: number) => {
    setForm((p) => {
      const v = p.variants[index];
      const next = [...p.variants];
      next[index] = { ...v, sku: generateSku(v.size, v.color, index) };
      return { ...p, variants: next };
    });
  };

  const generateAllSkus = () => {
    setForm((p) => ({
      ...p,
      variants: p.variants.map((v, i) => ({ ...v, sku: generateSku(v.size, v.color, i) })),
    }));
    open?.({ type: "success", message: "All SKUs generated" });
  };

  const getStockStatus = (stock: number | null, threshold: number) => {
    if (stock === null || stock === undefined) return { label: "N/A", class: "text-text-muted" };
    if (stock <= 0) return { label: "Out of Stock", class: "text-danger" };
    if (stock <= threshold) return { label: "Low Stock", class: "text-orange-500" };
    return { label: "In Stock", class: "text-emerald-600" };
  };

  const moveVariant = (from: number, to: number) => {
    if (to < 0 || to >= form.variants.length) return;
    setForm((p) => {
      const next = [...p.variants];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...p, variants: next.map((v, i) => ({ ...v, sortOrder: i })) };
    });
  };

  const handleDragStart = (index: number) => { setDragIndex(index); };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    moveVariant(dragIndex, index);
    setDragIndex(index);
  };
  const handleDragEnd = () => { setDragIndex(null); };

  const generateMatrix = () => {
    const sizes = matrixSizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = matrixColors.split(",").map((c) => c.trim()).filter(Boolean);
    if (sizes.length === 0 || colors.length === 0) {
      open?.({ type: "error", message: "Enter at least one size and one color" });
      return;
    }
    let idx = form.variants.length;
    const generated: VariantForm[] = [];
    for (const size of sizes) {
      for (const color of colors) {
        generated.push({ ...emptyVariant(idx++), size, color });
      }
    }
    if (generated.length === 0) return;
    setForm((p) => ({ ...p, variants: [...p.variants, ...generated] }));
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      for (let i = form.variants.length; i < form.variants.length + generated.length; i++) next.add(i);
      return next;
    });
    setMatrixOpen(false);
    open?.({ type: "success", message: `${generated.length} variants generated from matrix` });
  };

  const bulkUpdateVariants = (key: "stock" | "price" | "compareAt" | "weight" | "lowStockThreshold", value: number | null) => {
    if (value === null || value === undefined) return;
    setForm((p) => ({
      ...p,
      variants: p.variants.map((v) => ({ ...v, [key]: value })),
    }));
    open?.({ type: "success", message: `All variant ${key}s updated to ${value}` });
  };

  const clearAllVariants = () => {
    setForm((p) => ({ ...p, variants: [emptyVariant(0)] }));
    setExpandedVariants(new Set([0]));
    open?.({ type: "success", message: "Variants cleared" });
  };

  const toggleVariantEnabled = (index: number) => {
    setForm((p) => {
      const next = p.variants.map((v, i) => (i === index ? { ...v, enabled: !v.enabled } : v));
      return { ...p, variants: next };
    });
  };

  const handleVariantImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateVariant(index, "image", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const sortVariantsBy = (key: "size" | "color" | "price" | "stock" | "sku") => {
    setForm((p) => {
      const next = [...p.variants].sort((a, b) => {
        const va = (a as any)[key] ?? "";
        const vb = (b as any)[key] ?? "";
        return String(va).localeCompare(String(vb), undefined, { numeric: true });
      });
      return { ...p, variants: next.map((v, i) => ({ ...v, sortOrder: i })) };
    });
    open?.({ type: "success", message: `Variants sorted by ${key}` });
  };

  const handleSave = () => {
    if (!form.titleEn || !form.slug) {
      open?.({ type: "error", message: "Title (English) and Slug are required" });
      return;
    }
    const invalidVariants = form.variants.some(
      (v) => !v.sku || !v.size || !v.color
    );
    if (invalidVariants) {
      open?.({ type: "error", message: "All variants must have SKU, Size, and Color filled" });
      return;
    }
    setFieldErrors({});
    const values = {
      ...form,
      variants: form.variants.map((v, i) => ({
        ...v,
        stock: v.stock ?? 0,
        price: v.price ?? 0,
        sortOrder: i,
      })),
    };
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

  const filteredVariants = useMemo(() => {
    if (!variantSearch.trim()) return form.variants;
    const q = variantSearch.toLowerCase();
    return form.variants.filter(
      (v) =>
        v.sku.toLowerCase().includes(q) ||
        v.size.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q) ||
        v.barcode.toLowerCase().includes(q),
    );
  }, [form.variants, variantSearch]);

  const categoryBadges = useMemo(() =>
    categories.map((category: any) => (
      <button key={category.id} type="button" onClick={() => toggleCategory(category.id)}
        className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${form.categoryIds.includes(category.id) ? "border-ink bg-ink text-canvas" : "border-mist text-ink/70 hover:border-ink/30"}`}>
        {category.nameEn}
      </button>
    )), [categories, form.categoryIds]);

  const enabledCount = form.variants.filter((v) => v.enabled).length;
  const totalStock = form.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  const lowStockCount = form.variants.filter(
    (v) => v.stock !== null && v.stock > 0 && v.stock <= v.lowStockThreshold,
  ).length;
  const outOfStockCount = form.variants.filter((v) => v.stock !== null && v.stock <= 0).length;

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
                    <img src={url} alt={`Gallery ${i}`} className={`h-16 w-12 rounded-lg border border-mist object-cover ${i === 0 ? "ring-1 ring-ink/20" : ""}`} />
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
          <div className="rounded-2xl border border-mist bg-panel shadow-sm overflow-hidden">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-ink/60" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">
                    Variants <span className="text-text-muted font-normal">({form.variants.length})</span>
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setMatrixOpen(!matrixOpen)} title="Generate from matrix">
                    <Grid3X3 className="h-3.5 w-3.5 mr-1" />Matrix
                  </Button>
                  <Button variant="outline" size="sm" onClick={addVariant}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check className="h-3 w-3" />{enabledCount} active
                </span>
                <span className="text-text-muted/40">|</span>
                <span className="flex items-center gap-1 text-text-muted">
                  <Package className="h-3 w-3" />{totalStock} units
                </span>
                {lowStockCount > 0 && (
                  <>
                    <span className="text-text-muted/40">|</span>
                    <span className="flex items-center gap-1 text-orange-500">
                      <AlertTriangle className="h-3 w-3" />{lowStockCount} low
                    </span>
                  </>
                )}
                {outOfStockCount > 0 && (
                  <>
                    <span className="text-text-muted/40">|</span>
                    <span className="flex items-center gap-1 text-danger">
                      <X className="h-3 w-3" />{outOfStockCount} OOS
                    </span>
                  </>
                )}
              </div>
            </div>
            {matrixOpen && (
              <div className="border-t border-mist bg-canvas/50 p-4 lg:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-ink/60" />
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">Variant Matrix Generator</h4>
                </div>
                <p className="text-xs text-text-muted">Generate all size × color combinations at once.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium mb-1 block">Sizes</label>
                    <input value={matrixSizes} onChange={(e) => setMatrixSizes(e.target.value)}
                      placeholder="S, M, L, XL, XXL"
                      className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium mb-1 block">Colors</label>
                    <input value={matrixColors} onChange={(e) => setMatrixColors(e.target.value)}
                      placeholder="Black, White, Red, Blue"
                      className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={generateMatrix}><Grid3X3 className="h-3.5 w-3.5 mr-1" />Generate</Button>
                  <Button variant="outline" size="sm" onClick={() => setMatrixOpen(false)}>Cancel</Button>
                </div>
              </div>
            )}
            <div className="border-t border-mist">
              <div className="flex items-center gap-2 px-4 lg:px-6 py-2 bg-canvas/30">
                <Search className="h-3.5 w-3.5 text-text-muted shrink-0" />
                <input value={variantSearch} onChange={(e) => setVariantSearch(e.target.value)}
                  placeholder="Search by SKU, size, color, barcode..."
                  className="flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-text-muted/50" />
                {variantSearch && (
                  <button onClick={() => setVariantSearch("")} className="text-text-muted hover:text-ink transition">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="border-t border-mist px-4 lg:px-6 py-2 flex flex-wrap items-center gap-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium mr-1">Sort:</span>
              {(["size", "color", "price", "stock", "sku"] as const).map((key) => (
                <button key={key} onClick={() => sortVariantsBy(key)}
                  className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-lg text-text-muted hover:text-ink hover:bg-accent-soft transition">
                  {key}
                </button>
              ))}
              <span className="text-text-muted/30 mx-1">|</span>
              <button onClick={clearAllVariants}
                className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/5 transition">
                Clear
              </button>
            </div>
            <div ref={variantContainerRef} className="divide-y divide-mist max-h-[600px] overflow-y-auto">
              {(variantSearch ? filteredVariants : form.variants).map((variant, displayIdx) => {
                const actualIdx = form.variants.indexOf(variant);
                const isExpanded = expandedVariants.has(displayIdx);
                const status = getStockStatus(variant.stock, variant.lowStockThreshold);
                return (
                  <div key={displayIdx}
                    className={`relative group/variant transition ${!variant.enabled ? "opacity-50" : ""} ${dragIndex === displayIdx ? "ring-2 ring-ink/20 bg-accent-soft" : ""}`}
                    draggable
                    onDragStart={() => handleDragStart(displayIdx)}
                    onDragOver={(e) => handleDragOver(e, displayIdx)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="p-4 lg:p-5">
                      <div className="flex items-start gap-2">
                        <div className="mt-1.5 cursor-grab active:cursor-grabbing text-text-muted/30 hover:text-text-muted transition shrink-0">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-xs font-mono font-medium truncate ${variant.enabled ? "text-ink" : "text-text-muted"}`}>
                                {variant.sku || "SKU not set"}
                              </span>
                              <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full ${status.class} bg-current/5`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/variant:opacity-100 transition">
                              <button onClick={() => toggleVariantExpand(displayIdx)}
                                className="p-1 rounded-lg text-text-muted hover:text-ink hover:bg-accent-soft transition" title={isExpanded ? "Collapse" : "Expand"}>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                              <button onClick={() => duplicateVariant(actualIdx)}
                                className="p-1 rounded-lg text-text-muted hover:text-ink hover:bg-accent-soft transition" title="Duplicate">
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => toggleVariantEnabled(actualIdx)}
                                className="p-1 rounded-lg text-text-muted hover:text-ink hover:bg-accent-soft transition" title={variant.enabled ? "Disable" : "Enable"}>
                                {variant.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                              </button>
                              {form.variants.length > 1 && (
                                <button onClick={() => removeVariant(actualIdx)}
                                  className="p-1 rounded-lg text-danger/40 hover:text-danger hover:bg-danger/5 transition" title="Remove">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <Tags className="h-3 w-3" />{variant.size || "—"} / {variant.color || "—"}
                            </span>
                            <span className="font-mono">৳{variant.price ?? "—"}</span>
                            {variant.compareAt && (
                              <span className="font-mono line-through text-text-muted/50">৳{variant.compareAt}</span>
                            )}
                            <span>Stock: <span className={`font-medium ${(variant.stock ?? 0) <= 0 ? "text-danger" : (variant.stock ?? 0) <= variant.lowStockThreshold ? "text-orange-500" : "text-ink"}`}>{variant.stock ?? 0}</span></span>
                            {variant.barcode && <span className="font-mono text-[10px] text-text-muted/50">EAN: {variant.barcode}</span>}
                          </div>
                          {variant.image && (
                            <div className="mt-2">
                              <img src={variant.image} alt={variant.sku} className="h-10 w-10 rounded-lg border border-mist object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-4 pl-8 space-y-3 border-t border-mist/50 pt-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">SKU</span>
                                <div className="relative">
                                  <input value={variant.sku} onChange={(e) => updateVariant(actualIdx, "sku", e.target.value)} placeholder="QA-..." className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm text-ink outline-none transition-all duration-200 placeholder:text-text-muted/50 focus:ring-1 ${fieldErrors[`variants.${actualIdx}.sku`] ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5" : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"}`} />
                                  <button onClick={() => generateSingleSku(actualIdx)} className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg hover:bg-accent-soft transition" title="Generate SKU">
                                    <WandSparkles className="h-3 w-3 text-text-muted" />
                                  </button>
                                </div>
                              </label>
                            </div>
                            <div>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Barcode / EAN</span>
                                <input value={variant.barcode} onChange={(e) => updateVariant(actualIdx, "barcode", e.target.value)} placeholder="Optional barcode" className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 placeholder:text-text-muted/50" />
                              </label>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-4">
                            <div>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Size</span>
                                <input value={variant.size} onChange={(e) => updateVariant(actualIdx, "size", e.target.value)} placeholder="M" className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                              </label>
                            </div>
                            <div>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Color</span>
                                <input value={variant.color} onChange={(e) => updateVariant(actualIdx, "color", e.target.value)} placeholder="Black" className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                              </label>
                            </div>
                            <div>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Stock</span>
                                <input type="number" value={variant.stock ?? ""} onChange={(e) => updateVariant(actualIdx, "stock", e.target.value ? Number(e.target.value) : null)} placeholder="0" className={`w-full rounded-xl border px-4 py-2.5 text-sm text-ink outline-none focus:ring-1 ${(variant.stock ?? 0) <= 0 ? "border-danger/30 focus:border-danger focus:ring-danger/10" : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"}`} />
                              </label>
                            </div>
                            <div>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Low Stock Threshold</span>
                                <input type="number" value={variant.lowStockThreshold} onChange={(e) => updateVariant(actualIdx, "lowStockThreshold", Number(e.target.value))} placeholder="5" className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                              </label>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Price (BDT)</span>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">৳</span>
                                  <input type="number" value={variant.price ?? ""} onChange={(e) => updateVariant(actualIdx, "price", e.target.value ? Number(e.target.value) : null)} placeholder="0" className="w-full rounded-xl border border-mist bg-canvas pl-8 pr-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                                </div>
                              </label>
                            </div>
                            <div>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Compare At</span>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">৳</span>
                                  <input type="number" value={variant.compareAt ?? ""} onChange={(e) => updateVariant(actualIdx, "compareAt", e.target.value ? Number(e.target.value) : null)} placeholder="—" className="w-full rounded-xl border border-mist bg-canvas pl-8 pr-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                                </div>
                              </label>
                            </div>
                            <div>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Weight (kg)</span>
                                <input type="number" step="0.01" value={variant.weight ?? ""} onChange={(e) => updateVariant(actualIdx, "weight", e.target.value ? Number(e.target.value) : null)} placeholder="0.5" className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                              </label>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Variant Image</span>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input value={variant.image} onChange={(e) => updateVariant(actualIdx, "image", e.target.value)} placeholder="https://cdn.qaidilife.com/images/variant.jpg" className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 placeholder:text-text-muted/50" />
                              <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-mist bg-canvas px-3 py-2.5 text-xs text-text-muted hover:bg-accent-soft transition shrink-0">
                                <Upload className="h-3.5 w-3.5" />
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVariantImageUpload(actualIdx, f); e.target.value = ""; }} />
                              </label>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={variant.enabled} onChange={() => toggleVariantEnabled(actualIdx)} className="rounded border-mist text-ink focus:ring-ink/20" />
                              <span className="text-xs text-text-muted">Enabled</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-mist p-3 lg:p-4 flex flex-wrap items-center justify-between gap-2 bg-canvas/30">
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="font-medium text-ink">{form.variants.length}</span> variants
                <span className="text-text-muted/30 mx-1">·</span>
                <span className="font-medium text-ink">{enabledCount}</span> enabled
                <span className="text-text-muted/30 mx-1">·</span>
                <span className="font-medium text-ink">{totalStock}</span> total stock
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button onClick={generateAllSkus}
                  className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-lg text-text-muted hover:text-ink hover:bg-accent-soft transition">
                  <WandSparkles className="h-3 w-3 inline mr-0.5" />Generate SKUs
                </button>
                <div className="relative group/bulk">
                  <button className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-lg text-text-muted hover:text-ink hover:bg-accent-soft transition">
                    <ArrowUpDown className="h-3 w-3 inline mr-0.5" />Bulk
                  </button>
                  <div className="absolute right-0 bottom-full mb-1 hidden group-hover/bulk:block group-focus-within/bulk:block z-10">
                    <div className="bg-panel border border-mist rounded-xl shadow-lg p-2 min-w-[180px] space-y-1">
                      <button onClick={() => { const v = prompt("Set all stock to:"); if (v) bulkUpdateVariants("stock", Number(v)); }} className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Stock</button>
                      <button onClick={() => { const v = prompt("Set all price to:"); if (v) bulkUpdateVariants("price", Number(v)); }} className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Price</button>
                      <button onClick={() => { const v = prompt("Set compare-at to:"); if (v) bulkUpdateVariants("compareAt", Number(v)); }} className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Compare At</button>
                      <button onClick={() => { const v = prompt("Set weight (kg) to:"); if (v) bulkUpdateVariants("weight", Number(v)); }} className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Weight</button>
                      <button onClick={() => { const v = prompt("Set low stock threshold to:"); if (v) bulkUpdateVariants("lowStockThreshold", Number(v)); }} className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Threshold</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell></AdminGate>
  );
}
