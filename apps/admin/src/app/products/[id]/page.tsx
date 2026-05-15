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
  Eye, EyeOff, Search, Grid3X3, ArrowUpDown, Tags, Info, ToggleLeft,
} from "lucide-react";

interface ProductEditorProps { params: Promise<{ id: string }> }

interface VariantForm {
  sku: string; size: string; color: string; stock: number | null; price: number | null;
  compareAt: number | null; image: string; weight: number | null; barcode: string;
  lowStockThreshold: number; enabled: boolean; sortOrder: number;
}

interface GalleryImage {
  url: string;
  variantIds: string[];
}

interface ProductForm {
  titleEn: string; titleBn: string; slug: string;
  descriptionEn: string; descriptionBn: string;
  primaryImage: string; gallery: GalleryImage[];
  price: number | null; compareAt?: number | null; currency: string;
  variants: VariantForm[]; categoryIds: string[];
}

const COLOR_PRESETS = [
  { name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1B2838" }, { name: "Charcoal", hex: "#36454F" },
  { name: "Gray", hex: "#808080" }, { name: "Red", hex: "#CC0000" },
  { name: "Maroon", hex: "#800000" }, { name: "Burgundy", hex: "#900020" },
  { name: "Green", hex: "#2E7D32" }, { name: "Olive", hex: "#808000" },
  { name: "Blue", hex: "#1565C0" }, { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Brown", hex: "#6D4C41" }, { name: "Beige", hex: "#F5F5DC" },
  { name: "Cream", hex: "#FFFDD0" }, { name: "Khaki", hex: "#C3B091" },
  { name: "Orange", hex: "#FF6F00" }, { name: "Yellow", hex: "#F9A825" },
  { name: "Purple", hex: "#6A1B9A" }, { name: "Pink", hex: "#E91E63" },
];

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "Free"];

const colorMap = new Map(COLOR_PRESETS.map((c) => [c.name.toLowerCase(), c.hex]));
const getColorHex = (name: string): string => colorMap.get(name.toLowerCase()) ?? "#cccccc";

const CURRENCY_SYMBOLS: Record<string, string> = { BDT: "৳", USD: "$", EUR: "€", GBP: "£", INR: "₹" };
const getCurrencySymbol = (code: string): string => CURRENCY_SYMBOLS[code] ?? code;

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
  const [galleryDragIndex, setGalleryDragIndex] = useState<number | null>(null);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [matrixSizes, setMatrixSizes] = useState("");
  const [matrixColors, setMatrixColors] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
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
      const rawGallery = product.gallery ?? [];
      const mappedGallery: GalleryImage[] = rawGallery.map((item: any) => {
        if (typeof item === "string") return { url: item, variantIds: [] };
        return { url: item.url ?? item, variantIds: item.variantIds ?? [] };
      });
      const variants: VariantForm[] = (product.variants ?? []).map((v: any, i: number) => ({
        sku: v.sku ?? "", size: v.size ?? "", color: v.color ?? "",
        stock: v.stock ?? null, price: v.price ?? null,
        compareAt: v.compareAt ?? null, image: v.image ?? "",
        weight: v.weight ?? null, barcode: v.barcode ?? "",
        lowStockThreshold: v.lowStockThreshold ?? 5,
        enabled: v.enabled ?? true, sortOrder: v.sortOrder ?? i,
      }));
      const hasOptions = variants.some((v) => v.size || v.color);
      setHasVariants(hasOptions);
      setForm({
        titleEn: product.titleEn ?? "",
        titleBn: product.titleBn ?? "",
        slug: product.slug ?? "",
        descriptionEn: product.descriptionEn ?? "",
        descriptionBn: product.descriptionBn ?? "",
        primaryImage: product.primaryImage ?? "",
        gallery: mappedGallery,
        price: product.price ?? null,
        compareAt: product.compareAt ?? null,
        currency: product.currency ?? "BDT",
        variants: variants.length ? variants : [emptyVariant(0)],
        categoryIds: (product.categories ?? []).map((c: any) => c.id ?? c.category?.id).filter(Boolean),
      });
    }
  }, [isNew, productQuery.data]);

  const slugManuallyEdited = useRef(false);
  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

  const handleTitleChange = (value: string) => {
    updateField("titleEn", value);
    if (!slugManuallyEdited.current) updateField("slug", slugify(value));
  };
  const handleSlugFocus = () => { slugManuallyEdited.current = true; };
  const handleSlugBlur = (value: string) => { if (!value.trim()) slugManuallyEdited.current = false; };

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
    if (Object.keys(errors).length > 0) setFieldErrors(errors);
  };
  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
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
        clearFieldError("primaryImage");
        updateField("primaryImage", dataUrl);
      } else {
        setForm((prev) => ({ ...prev, gallery: [...prev.gallery, { url: dataUrl, variantIds: [] }] }));
      }
      open?.({ type: "success", message: "Image uploaded" });
    };
    reader.onerror = () => open?.({ type: "error", message: "Failed to read file" });
    reader.readAsDataURL(file);
  };

  const handleMultipleGalleryUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const readers: FileReader[] = [];
    const results: string[] = [];
    let completed = 0;
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      const idx = i;
      reader.onload = (e) => {
        results[idx] = e.target?.result as string;
        completed++;
        if (completed === files.length) {
          setForm((prev) => ({
            ...prev,
            gallery: [...prev.gallery, ...results.map((url) => ({ url, variantIds: [] }))],
          }));
          open?.({ type: "success", message: `${files.length} images uploaded` });
        }
      };
      reader.onerror = () => { completed++; if (completed === files.length) open?.({ type: "error", message: "Some images failed to upload" }); };
      reader.readAsDataURL(files[i]);
      readers.push(reader);
    }
  };

  const handleAddGalleryUrl = () => {
    const url = prompt("Enter image URL:");
    if (url) updateField("gallery", [...form.gallery, { url, variantIds: [] }]);
  };

  const handleRemoveGalleryImage = (index: number) => {
    updateField("gallery", form.gallery.filter((_, j) => j !== index));
  };

  const toggleGalleryVariant = (imgIndex: number, variantId: string) => {
    setForm((p) => {
      const next = p.gallery.map((img, i) => {
        if (i !== imgIndex) return img;
        const ids = img.variantIds.includes(variantId)
          ? img.variantIds.filter((vid) => vid !== variantId)
          : [...img.variantIds, variantId];
        return { ...img, variantIds: ids };
      });
      return { ...p, gallery: next };
    });
  };

  const updateVariant = (index: number, key: keyof VariantForm, value: string | number | boolean | null) => {
    clearFieldError(`variants.${index}.${key}`);
    setForm((p) => {
      const next = p.variants.map((v, i) => (i === index ? { ...v, [key]: value } : v));
      return { ...p, variants: next };
    });
  };

  const toggleVariants = () => {
    const next = !hasVariants;
    setHasVariants(next);
    if (next) {
      if (form.variants.length === 1 && !form.variants[0].size && !form.variants[0].color) {
        setForm((p) => ({
          ...p,
          variants: p.variants.map((v) => ({
            ...v,
            price: v.price ?? p.price,
            compareAt: v.compareAt ?? p.compareAt ?? null,
          })),
        }));
      }
    }
  };

  const addVariant = () => {
    const idx = form.variants.length;
    setForm((p) => ({ ...p, variants: [...p.variants, { ...emptyVariant(idx), price: p.price }] }));
    setExpandedVariants((prev) => new Set(prev).add(idx));
    setTimeout(() => variantContainerRef.current?.scrollTo({ top: variantContainerRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  const removeVariant = (index: number) => {
    setForm((p) => {
      const next = p.variants.filter((_, i) => i !== index).map((v, i) => ({ ...v, sortOrder: i }));
      return { ...p, variants: next.length ? next : [{ ...emptyVariant(0), price: p.price }] };
    });
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      next.delete(index);
      const adjusted = new Set<number>();
      for (const v of next) adjusted.add(v > index ? v - 1 : v);
      return adjusted;
    });
  };

  const duplicateVariant = (index: number) => {
    const idx = form.variants.length;
    setForm((p) => {
      const clone = { ...p.variants[index], sku: "", sortOrder: idx };
      return { ...p, variants: [...p.variants, clone] };
    });
    setExpandedVariants((prev) => new Set(prev).add(idx));
  };

  const toggleVariantExpand = (index: number) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
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

  const generateBarcode = (): string => {
    const prefix = "QA";
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${rand}`;
  };

  const generateSingleBarcode = (index: number) => {
    setForm((p) => {
      const next = [...p.variants];
      next[index] = { ...next[index], barcode: generateBarcode() };
      return { ...p, variants: next };
    });
    open?.({ type: "success", message: "Barcode generated" });
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
      open?.({ type: "error", message: "Enter at least one size and one color" }); return;
    }
    let idx = form.variants.length;
    const generated: VariantForm[] = [];
    for (const size of sizes) {
      for (const color of colors) {
        generated.push({ ...emptyVariant(idx++), size, color, price: form.price });
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

  const applyBasePriceToVariants = () => {
    if (form.price === null || form.price === undefined) {
      open?.({ type: "error", message: "Set a base price first" }); return;
    }
    setForm((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v, price: p.price })) }));
    open?.({ type: "success", message: `Base price ${getCurrencySymbol(form.currency)}${form.price} applied to all variants` });
  };

  const bulkUpdateVariants = (key: "stock" | "price" | "compareAt" | "weight" | "lowStockThreshold", value: number | null) => {
    if (value === null || value === undefined) return;
    setForm((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v, [key]: value })) }));
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
    reader.onload = (e) => updateVariant(index, "image", e.target?.result as string);
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
    const newErrors: Record<string, string> = {};

    if (!form.titleEn) newErrors["titleEn"] = "Title (English) is required";
    if (!form.slug) newErrors["slug"] = "Slug is required";
    if (!form.primaryImage) newErrors["primaryImage"] = "Primary image is required";
    if (form.price === null || form.price === undefined || form.price <= 0) {
      newErrors["price"] = "Price must be greater than 0";
    }
    if (!form.categoryIds || form.categoryIds.length === 0) {
      newErrors["categoryIds"] = "At least one category is required";
    }

    if (hasVariants) {
      form.variants.forEach((v, i) => {
        if (!v.sku) newErrors[`variants.${i}.sku`] = "SKU is required";
        if (!v.size && !v.color) newErrors[`variants.${i}.options`] = "Size or color required";
      });
    } else {
      if (!form.variants[0]?.sku) {
        newErrors["variants.0.sku"] = "Product SKU is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      open?.({ type: "error", message: "Validation failed. Please check all fields." });
      return;
    }

    setFieldErrors({});

    // Clean up variants: ensure stock/price are numbers, and other fields are null if empty
    const cleanVariants = form.variants.map((v, i) => ({
      ...v,
      stock: Number(v.stock ?? 0),
      price: Number(v.price ?? (hasVariants ? 0 : form.price ?? 0)),
      compareAt: v.compareAt === null || v.compareAt === undefined ? null : Number(v.compareAt),
      weight: v.weight === null || v.weight === undefined ? null : Number(v.weight),
      lowStockThreshold: v.lowStockThreshold === null || v.lowStockThreshold === undefined ? 5 : Number(v.lowStockThreshold),
      sortOrder: i,
      sku: v.sku.trim(),
      barcode: v.barcode?.trim() || null,
      image: v.image || null,
    }));

    const values = {
      ...form,
      gallery: form.gallery.map((g) => g.variantIds.length > 0 ? g : g.url),
      variants: hasVariants ? cleanVariants : [cleanVariants[0]],
      price: Number(form.price ?? 0),
      compareAt: form.compareAt === null || form.compareAt === undefined ? null : Number(form.compareAt),
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
      (v) => v.sku.toLowerCase().includes(q) || v.size.toLowerCase().includes(q) ||
             v.color.toLowerCase().includes(q) || v.barcode.toLowerCase().includes(q),
    );
  }, [form.variants, variantSearch]);

  const categoryBadges = useMemo(() =>
    categories.map((category: any) => (
      <button key={category.id} type="button" onClick={() => toggleCategory(category.id)}
        className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
          form.categoryIds.includes(category.id)
            ? "border-ink bg-ink text-canvas" : "border-mist text-ink/70 hover:border-ink/30"
        }`}>
        {category.nameEn}
      </button>
    )), [categories, form.categoryIds]);

  const enabledCount = form.variants.filter((v) => v.enabled).length;
  const totalStock = form.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  const lowStockCount = form.variants.filter((v) => v.stock !== null && v.stock > 0 && v.stock <= v.lowStockThreshold).length;
  const outOfStockCount = form.variants.filter((v) => v.stock !== null && v.stock <= 0).length;

  return (
    <AdminGate><AdminShell>
        <PageHeader title={isNew ? "Create Product" : "Edit Product"} subtitle="Keep product details, imagery, and variants aligned."
          actions={<div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/products")}><X className="h-3.5 w-3.5 mr-1.5" />Cancel</Button>
            <Button onClick={handleSave}><Check className="h-3.5 w-3.5 mr-1.5" />Save</Button>
          </div>} />

        {/* Product Type Toggle */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-mist bg-panel p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-mist bg-canvas overflow-hidden">
              <button onClick={() => { if (hasVariants) toggleVariants(); }}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
                  !hasVariants ? "bg-ink text-canvas shadow-sm" : "text-text-muted hover:text-ink"
                }`}>
                Simple Product
              </button>
              <button onClick={() => { if (!hasVariants) toggleVariants(); }}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
                  hasVariants ? "bg-ink text-canvas shadow-sm" : "text-text-muted hover:text-ink"
                }`}>
                Has Variants
              </button>
            </div>
            <p className="text-xs text-text-muted hidden sm:block max-w-xs">
              {hasVariants
                ? "Each option combination (size/color) is a variant with its own price, SKU, and stock."
                : "A single item with one price, SKU, and stock."}
            </p>
          </div>
        </div>
      <div className={`mt-6 grid gap-6 w-full ${
          hasVariants ? "lg:grid-cols-[1fr_2fr]" : ""
        }`}>

        {/* ── Left Column: Product Info ── */}
        <section className="space-y-5 rounded-2xl border border-mist bg-panel p-5 lg:p-6 shadow-sm min-w-0 overflow-hidden">
          <div className="grid gap-5">
            <Input label="Title (English)" value={form.titleEn} onChange={(e) => handleTitleChange(e.target.value)} error={fieldErrors["titleEn"]} />
            <Input label="Title (Bengali)" value={form.titleBn} onChange={(e) => updateField("titleBn", e.target.value)} error={fieldErrors["titleBn"]} />
            <Input label="Slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} onFocus={handleSlugFocus} onBlur={(e) => handleSlugBlur(e.target.value)} error={fieldErrors["slug"]} />
          </div>

          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-text-muted font-medium">
            Description (English)
            <textarea value={form.descriptionEn} onChange={(e) => { clearFieldError("descriptionEn"); updateField("descriptionEn", e.target.value); }}
              className={`min-h-[100px] rounded-xl border p-3 text-base sm:text-sm text-ink outline-none resize-y transition focus:ring-1 ${
                fieldErrors["descriptionEn"]
                  ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5"
                  : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"
              }`} />
            {fieldErrors["descriptionEn"] && (
              <p className="text-[10px] text-danger mt-1 font-medium">{fieldErrors["descriptionEn"]}</p>
            )}
          </label>
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-text-muted font-medium">
            Description (Bengali)
            <textarea value={form.descriptionBn} onChange={(e) => { clearFieldError("descriptionBn"); updateField("descriptionBn", e.target.value); }}
              className={`min-h-[100px] rounded-xl border p-3 text-base sm:text-sm text-ink outline-none resize-y transition focus:ring-1 ${
                fieldErrors["descriptionBn"]
                  ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5"
                  : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"
              }`} />
            {fieldErrors["descriptionBn"] && (
              <p className="text-[10px] text-danger mt-1 font-medium">{fieldErrors["descriptionBn"]}</p>
            )}
          </label>

          {/* Primary Image */}
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium">Primary Image *</label>
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <div className="flex flex-col gap-1.5">
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border transition ${
                  hasVariants ? "px-3 py-2 text-xs" : "px-6 py-3 text-sm"
                } ${
                  fieldErrors["primaryImage"]
                    ? "border-danger/50 bg-danger/5 text-danger"
                    : "border-mist bg-canvas text-text-muted hover:bg-accent-soft"
                }`}>
                  <Upload className={`${hasVariants ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
                  <span>Choose File</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload("primaryImage", f); e.target.value = ""; }} />
                </label>
                {fieldErrors["primaryImage"] && (
                  <p className="text-[10px] text-danger font-medium">{fieldErrors["primaryImage"]}</p>
                )}
              </div>
              <Input value={form.primaryImage} onChange={(e) => { clearFieldError("primaryImage"); updateField("primaryImage", e.target.value); }}
                placeholder="https://cdn.qaidilife.com/images/product.jpg"
                className={fieldErrors["primaryImage"] ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5" : ""}
              />
            </div>
            {form.primaryImage && (
              <div className="relative inline-block group">
                <img src={form.primaryImage} alt="Primary" className="h-20 w-16 rounded-lg border border-mist object-cover" />
                <button onClick={() => updateField("primaryImage", "")} className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-xs opacity-0 group-hover:opacity-100 transition">×</button>
              </div>
            )}
          </div>

          {/* Gallery with Image-to-Variant Linking */}
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium">
              Gallery Images
              {hasVariants && form.variants.length > 1 && (
                <span className="ml-2 text-[10px] font-normal text-text-muted/60">
                  — click an image, then check which variant(s) it belongs to
                </span>
              )}
            </label>
            {form.gallery.length > 0 && (
              <div className="flex flex-col gap-2">
                {form.gallery.map((img, i) => (
                  <div key={i}
                    className={`rounded-xl border border-mist bg-canvas/50 p-3 transition ${
                      galleryDragIndex === i ? "opacity-50 ring-2 ring-ink/20" : ""
                    }`}
                    draggable
                    onDragStart={() => setGalleryDragIndex(i)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (galleryDragIndex === null || galleryDragIndex === i) return;
                      setForm((p) => {
                        const next = [...p.gallery];
                        const [moved] = next.splice(galleryDragIndex, 1);
                        next.splice(i, 0, moved);
                        return { ...p, gallery: next };
                      });
                      setGalleryDragIndex(i);
                    }}
                    onDragEnd={() => setGalleryDragIndex(null)}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="mt-1 cursor-grab active:cursor-grabbing text-text-muted/30 hover:text-text-muted transition shrink-0">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="relative group shrink-0">
                        <img src={img.url} alt={`Gallery ${i}`} className="h-16 w-12 rounded-lg border border-mist object-cover" />
                        <button onClick={() => handleRemoveGalleryImage(i)}
                          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white text-[10px] opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-text-muted truncate">{img.url}</p>
                        {hasVariants && form.variants.length > 1 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {form.variants.map((v, vi) => {
                              const label = [v.size, v.color].filter(Boolean).join(" / ") || `Variant ${vi + 1}`;
                              const checked = img.variantIds.includes(String(vi));
                              return (
                                <label key={vi} className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] cursor-pointer transition ${
                                  checked ? "border-ink bg-ink text-canvas" : "border-mist text-text-muted hover:border-ink/30"
                                }`}>
                                  <input type="checkbox" checked={checked} onChange={() => toggleGalleryVariant(i, String(vi))} className="sr-only" />
                                  {v.size && <span className="font-medium">{v.size}</span>}
                                  {v.size && v.color && <span>/</span>}
                                  {v.color && <span>{v.color}</span>}
                                  {!v.size && !v.color && <span>Variant {vi + 1}</span>}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleMultipleGalleryUpload(e.dataTransfer.files); }}
              className="flex flex-wrap gap-2 rounded-xl border-2 border-dashed border-mist p-4 transition hover:border-ink/30">
              <button onClick={handleAddGalleryUrl}
                className="rounded-xl border border-dashed border-mist px-3 py-2 text-xs text-text-muted hover:text-ink hover:border-ink/30 transition">
                + Add URL
              </button>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-mist px-3 py-2 text-xs text-text-muted hover:text-ink hover:border-ink/30 transition">
                <Upload className="h-3.5 w-3.5" /> Upload Files
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleMultipleGalleryUpload(e.target.files); e.target.value = ""; }} />
              </label>
            </div>
          </div>

          {/* Base Price Fields */}
          <div className="rounded-xl border border-mist bg-canvas/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-info" />
              <span className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">
                {hasVariants ? "Listing Price (shown on collections)" : "Price"}
              </span>
            </div>
            <div className={`grid gap-3 ${hasVariants ? "grid-cols-2" : "sm:grid-cols-5"}`}>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Price *</label>
                <input type="number" value={form.price ?? ""} onChange={(e) => { 
                  const val = e.target.value ? Number(e.target.value) : null;
                  clearFieldError("price"); 
                  setForm(prev => ({
                    ...prev,
                    price: val,
                    variants: prev.variants.map(v => ({
                      ...v,
                      price: (v.price === null || v.price === 0 || v.price === prev.price) ? val : v.price
                    }))
                  }));
                }}
                  placeholder="0"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-ink outline-none transition focus:ring-1 mt-1 ${
                    fieldErrors["price"]
                      ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5"
                      : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"
                  }`} />
                {fieldErrors["price"] && (
                  <p className="text-[10px] text-danger mt-1 font-medium">{fieldErrors["price"]}</p>
                )}
                {hasVariants && form.variants.length > 1 && form.price !== null && (
                  <button onClick={applyBasePriceToVariants} className="mt-1 text-[10px] uppercase tracking-[0.15em] text-info hover:text-info/80 transition">Apply to all variants</button>
                )}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Compare At</label>
                <input type="number" value={form.compareAt ?? ""} onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setForm(prev => ({
                    ...prev,
                    compareAt: val,
                    variants: prev.variants.map(v => ({
                      ...v,
                      compareAt: (v.compareAt === null || v.compareAt === 0 || v.compareAt === prev.compareAt) ? val : v.compareAt
                    }))
                  }));
                }}
                  placeholder="0"
                  className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 mt-1" />
              </div>
              <div className={hasVariants ? "col-span-2" : ""}>
                <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Currency</label>
                <select value={form.currency} onChange={(e) => updateField("currency", e.target.value)}
                  className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 mt-1">
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              {!hasVariants && (
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Stock</label>
                  <input type="number" value={form.variants[0]?.stock ?? ""} onChange={(e) => updateVariant(0, "stock", e.target.value ? Number(e.target.value) : null)}
                    placeholder="0"
                    className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 mt-1" />
                </div>
              )}
              {!hasVariants && (
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Low Stock Threshold</label>
                  <input type="number" value={form.variants[0]?.lowStockThreshold ?? 5} onChange={(e) => updateVariant(0, "lowStockThreshold", Number(e.target.value))}
                    className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 mt-1" />
                </div>
              )}
            </div>
          </div>

          {/* Simple Product Fields (SKU, Barcode, Weight — visible only when variants are OFF) */}
          {!hasVariants && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">SKU *</label>
                <div className="relative mt-1">
                  <input type="text" value={form.variants[0]?.sku ?? ""}
                    onChange={(e) => { clearFieldError("variants.0.sku"); updateVariant(0, "sku", e.target.value); }}
                    placeholder="QA-..."
                    className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm text-ink outline-none transition focus:ring-1 ${
                      fieldErrors["variants.0.sku"]
                        ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5"
                        : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"
                    }`} />
                  <button onClick={() => generateSingleSku(0)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg hover:bg-accent-soft transition" title="Generate SKU">
                    <WandSparkles className="h-3 w-3 text-text-muted" />
                  </button>
                </div>
                {fieldErrors["variants.0.sku"] && (
                  <p className="text-[10px] text-danger mt-1 font-medium">{fieldErrors["variants.0.sku"]}</p>
                )}
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">Barcode / EAN</label>
                <div className="relative mt-1">
                  <input type="text" value={form.variants[0]?.barcode ?? ""}
                    onChange={(e) => updateVariant(0, "barcode", e.target.value)}

                    className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 pr-10 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                  <button onClick={() => generateSingleBarcode(0)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg hover:bg-accent-soft transition" title="Generate barcode">
                    <WandSparkles className="h-3 w-3 text-text-muted" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">Weight (kg)</label>
                <input type="number" step="0.01" value={form.variants[0]?.weight ?? ""}
                  onChange={(e) => updateVariant(0, "weight", e.target.value ? Number(e.target.value) : null)}
                  placeholder="0.5"
                  className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 mt-1" />
              </div>
            </div>
          )}

          {/* Categories */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium mb-3">Categories *</h3>
            <div className="flex flex-wrap gap-2">{categoryBadges}</div>
            {fieldErrors["categoryIds"] && (
              <p className="text-[10px] text-danger mt-2 font-medium">{fieldErrors["categoryIds"]}</p>
            )}
          </div>
        </section>

        {/* ── Right Column: Variants (only when toggle is ON) ── */}
        {hasVariants && (
          <section className="space-y-5 min-w-0 overflow-hidden">
            <div className="rounded-2xl border border-mist bg-panel shadow-sm overflow-hidden">
              <div className="p-4 lg:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-ink/60" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">
                      Variants <span className="text-text-muted font-normal">({form.variants.length})</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setMatrixOpen(!matrixOpen)} title="Generate size × color combinations">
                      <Grid3X3 className="h-3.5 w-3.5 mr-1" />Matrix
                    </Button>
                    <Button variant="outline" size="sm" onClick={addVariant}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                  </div>
                </div>

                {/* Variant Guidance */}
                <div className="rounded-xl bg-info/5 border border-info/10 px-4 py-3">
                  <div className="flex items-start gap-2 text-xs text-text-secondary">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-info" />
                    <div>
                      <span className="font-medium text-ink">Variant Options</span>
                      <p className="mt-0.5">
                        Each variant is a unique combination of <strong>size</strong> and <strong>color</strong>.
                        Every variant has its own price, SKU, stock, and can have its own image.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {matrixOpen && (
                <div className="border-t border-mist bg-canvas/50 p-4 lg:p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4 text-ink/60" />
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">Variant Matrix Generator</h4>
                  </div>
                  <p className="text-xs text-text-muted">Generate all size × color combinations at once. Comma-separated values or click presets.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium mb-1 block">Sizes</label>
                      <input value={matrixSizes} onChange={(e) => setMatrixSizes(e.target.value)}
                        placeholder="S, M, L, XL, XXL"
                        className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {SIZE_PRESETS.map((s) => (
                          <button key={s} onClick={() => setMatrixSizes((prev) => (prev ? `${prev}, ${s}` : s))}
                            className="px-2 py-0.5 text-[10px] rounded-md border border-mist text-text-muted hover:border-ink/30 hover:text-ink transition">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium mb-1 block">Colors</label>
                      <input value={matrixColors} onChange={(e) => setMatrixColors(e.target.value)}
                        placeholder="Black, White, Red, Blue"
                        className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {COLOR_PRESETS.slice(0, 12).map((c) => (
                          <button key={c.name} onClick={() => setMatrixColors((prev) => (prev ? `${prev}, ${c.name}` : c.name))}
                            title={c.name}
                            className="inline-block h-5 w-5 rounded-full border border-mist transition hover:scale-110"
                            style={{ backgroundColor: c.hex }} />
                        ))}
                      </div>
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
                                <span className={`text-xs font-mono font-semibold truncate ${variant.enabled ? "text-ink" : "text-text-muted"}`}>
                                  {variant.sku || <span className="text-text-muted/50 italic">No SKU</span>}
                                </span>
                                {variant.barcode && (
                                  <span className="text-[10px] font-mono text-text-muted/50 hidden sm:inline">EAN: {variant.barcode}</span>
                                )}
                                <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full ${status.class} bg-current/5`}>
                                  {status.label}
                                </span>
                                {fieldErrors[`variants.${actualIdx}.options`] && (
                                  <span className="text-[10px] text-danger font-medium">{fieldErrors[`variants.${actualIdx}.options`]}</span>
                                )}
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
                              <span className="flex items-center gap-1.5">
                                <Tags className="h-3 w-3 shrink-0" />
                                {variant.size && <span className="font-medium text-ink/80">{variant.size}</span>}
                                {variant.size && variant.color && <span className="text-text-muted/40">/</span>}
                                {variant.color && (
                                  <span className="flex items-center gap-1">
                                    <span className="inline-block h-3 w-3 rounded-full border border-mist shrink-0" style={{ backgroundColor: getColorHex(variant.color) }} />
                                    {variant.color}
                                  </span>
                                )}
                                {!variant.size && !variant.color && <span className="text-text-muted/50">—</span>}
                              </span>
                              <span className="font-mono">{getCurrencySymbol(form.currency)}{variant.price ?? "—"}</span>
                              {variant.compareAt && <span className="font-mono line-through text-text-muted/50">{getCurrencySymbol(form.currency)}{variant.compareAt}</span>}
                              <span>Stock: <span className={`font-medium ${(variant.stock ?? 0) <= 0 ? "text-danger" : (variant.stock ?? 0) <= variant.lowStockThreshold ? "text-orange-500" : "text-ink"}`}>{variant.stock ?? 0}</span></span>
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
                                    <input value={variant.sku} onChange={(e) => updateVariant(actualIdx, "sku", e.target.value)}
                                      placeholder="QA-..."
                                      className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm text-ink outline-none transition focus:ring-1 ${
                                        fieldErrors[`variants.${actualIdx}.sku`]
                                          ? "border-danger/50 focus:border-danger focus:ring-danger/10 bg-danger/5"
                                          : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"
                                      }`} />
                                    <button onClick={() => generateSingleSku(actualIdx)}
                                      className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg hover:bg-accent-soft transition" title="Generate SKU">
                                      <WandSparkles className="h-3 w-3 text-text-muted" />
                                    </button>
                                  </div>
                                </label>
                              </div>
                              <div>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Barcode / EAN</span>
                                  <div className="relative">
                                    <input value={variant.barcode} onChange={(e) => updateVariant(actualIdx, "barcode", e.target.value)}
                                      placeholder="Optional barcode"
                                      className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 pr-10 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 placeholder:text-text-muted/50" />
                                    <button onClick={() => generateSingleBarcode(actualIdx)}
                                      className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg hover:bg-accent-soft transition" title="Generate barcode">
                                      <WandSparkles className="h-3 w-3 text-text-muted" />
                                    </button>
                                  </div>
                                </label>
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-4">
                              <div>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Size</span>
                                  <input value={variant.size} onChange={(e) => updateVariant(actualIdx, "size", e.target.value)} placeholder="M"
                                    className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                                </label>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {SIZE_PRESETS.slice(0, 6).map((s) => (
                                    <button key={s} onClick={() => updateVariant(actualIdx, "size", s)}
                                      className={`px-2 py-0.5 text-[10px] rounded-md border transition ${
                                        variant.size === s
                                          ? "border-ink bg-ink text-canvas" : "border-mist text-text-muted hover:border-ink/30 hover:text-ink"
                                      }`}>
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Color</span>
                                  <div className="relative">
                                    <input value={variant.color} onChange={(e) => updateVariant(actualIdx, "color", e.target.value)} placeholder="Black"
                                      className="w-full rounded-xl border border-mist bg-canvas pl-9 pr-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 inline-block h-4 w-4 rounded-full border border-mist"
                                      style={{ backgroundColor: getColorHex(variant.color) }} />
                                  </div>
                                </label>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {COLOR_PRESETS.slice(0, 8).map((c) => (
                                    <button key={c.name} onClick={() => updateVariant(actualIdx, "color", c.name)} title={c.name}
                                      className={`inline-block h-5 w-5 rounded-full border transition hover:scale-110 ${
                                        variant.color.toLowerCase() === c.name.toLowerCase() ? "border-ink ring-1 ring-ink" : "border-mist"
                                      }`}
                                      style={{ backgroundColor: c.hex }} />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Stock</span>
                                  <input type="number" value={variant.stock ?? ""} onChange={(e) => updateVariant(actualIdx, "stock", e.target.value ? Number(e.target.value) : null)} placeholder="0"
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-ink outline-none focus:ring-1 ${
                                      (variant.stock ?? 0) <= 0
                                        ? "border-danger/30 focus:border-danger focus:ring-danger/10"
                                        : "border-mist bg-canvas focus:border-ink/30 focus:ring-ink/10"
                                    }`} />
                                </label>
                              </div>
                              <div>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Low Stock Threshold</span>
                                  <input type="number" value={variant.lowStockThreshold} onChange={(e) => updateVariant(actualIdx, "lowStockThreshold", Number(e.target.value))} placeholder="5"
                                    className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                                </label>
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Price</span>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">{getCurrencySymbol(form.currency)}</span>
                                    <input type="number" value={variant.price ?? ""} onChange={(e) => updateVariant(actualIdx, "price", e.target.value ? Number(e.target.value) : null)} placeholder="0"
                                      className="w-full rounded-xl border border-mist bg-canvas pl-8 pr-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                                  </div>
                                </label>
                              </div>
                              <div>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Compare At</span>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">{getCurrencySymbol(form.currency)}</span>
                                    <input type="number" value={variant.compareAt ?? ""} onChange={(e) => updateVariant(actualIdx, "compareAt", e.target.value ? Number(e.target.value) : null)} placeholder="—"
                                      className="w-full rounded-xl border border-mist bg-canvas pl-8 pr-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                                  </div>
                                </label>
                              </div>
                              <div>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Weight (kg)</span>
                                  <input type="number" step="0.01" value={variant.weight ?? ""} onChange={(e) => updateVariant(actualIdx, "weight", e.target.value ? Number(e.target.value) : null)} placeholder="0.5"
                                    className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10" />
                                </label>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Variant Image</span>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input value={variant.image} onChange={(e) => updateVariant(actualIdx, "image", e.target.value)}
                                  placeholder="https://cdn.qaidilife.com/images/variant.jpg"
                                  className="w-full rounded-xl border border-mist bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 placeholder:text-text-muted/50" />
                                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-mist bg-canvas px-3 py-2.5 text-xs text-text-muted hover:bg-accent-soft transition shrink-0">
                                  <Upload className="h-3.5 w-3.5" /> Upload
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVariantImageUpload(actualIdx, f); e.target.value = ""; }} />
                                </label>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={variant.enabled} onChange={() => toggleVariantEnabled(actualIdx)}
                                  className="rounded border-mist text-ink focus:ring-ink/20" />
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
                    <WandSparkles className="h-3 w-3 inline mr-0.5" />SKUs
                  </button>
                  <button onClick={() => { setForm((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v, barcode: v.barcode || generateBarcode() })) })); open?.({ type: "success", message: "Barcodes generated for empty fields" }); }}
                    className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-lg text-text-muted hover:text-ink hover:bg-accent-soft transition">
                    <WandSparkles className="h-3 w-3 inline mr-0.5" />Barcodes
                  </button>
                  <div className="relative group/bulk">
                    <button className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-lg text-text-muted hover:text-ink hover:bg-accent-soft transition">
                      <ArrowUpDown className="h-3 w-3 inline mr-0.5" />Bulk
                    </button>
                    <div className="absolute right-0 bottom-full mb-1 hidden group-hover/bulk:block group-focus-within/bulk:block z-10">
                      <div className="bg-panel border border-mist rounded-xl shadow-lg p-2 min-w-[180px] space-y-1">
                        <button onClick={() => { const v = prompt("Set all stock to:"); if (v) bulkUpdateVariants("stock", Number(v)); }}
                          className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Stock</button>
                        <button onClick={() => { const v = prompt("Set all price to:"); if (v) bulkUpdateVariants("price", Number(v)); }}
                          className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Price</button>
                        <button onClick={() => { const v = prompt("Set compare-at to:"); if (v) bulkUpdateVariants("compareAt", Number(v)); }}
                          className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Compare At</button>
                        <button onClick={() => { const v = prompt("Set weight (kg) to:"); if (v) bulkUpdateVariants("weight", Number(v)); }}
                          className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Weight</button>
                        <button onClick={() => { const v = prompt("Set low stock threshold to:"); if (v) bulkUpdateVariants("lowStockThreshold", Number(v)); }}
                          className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-accent-soft transition">Set all Threshold</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </AdminShell></AdminGate>
  );
}
