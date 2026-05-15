"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Upload, Globe, Hash, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import type { AdminCategory } from "@/lib/types";

interface CategoryFormData {
  nameEn: string;
  nameBn: string;
  slug: string;
  descriptionEn: string;
  descriptionBn: string;
  image: string;
  parentId: string;
  order: number;
  status: "active" | "inactive";
  featured: boolean;
  metaTitleEn: string;
  metaTitleBn: string;
  metaDescriptionEn: string;
  metaDescriptionBn: string;
}

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: AdminCategory | null;
  parentOptions: Array<{ id: string; nameEn: string; nameBn: string; depth: number }>;
  loading?: boolean;
}

const emptyForm: CategoryFormData = {
  nameEn: "", nameBn: "", slug: "", descriptionEn: "", descriptionBn: "",
  image: "", parentId: "", order: 0, status: "active", featured: false,
  metaTitleEn: "", metaTitleBn: "", metaDescriptionEn: "", metaDescriptionBn: "",
};

export type { CategoryFormData };

export function CategoryFormModal({
  open, onOpenChange, onSubmit, category, parentOptions, loading,
}: CategoryFormModalProps) {
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [seoOpen, setSeoOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const isEditing = !!category;
  const initKey = useRef<string>("");
  const currentKey = category?.id ?? "__new__";

  useEffect(() => {
    if (!open) { initKey.current = ""; return; }
    if (initKey.current === currentKey) return;
    initKey.current = currentKey;

    if (category) {
      setForm({
        nameEn: category.nameEn ?? "",
        nameBn: category.nameBn ?? "",
        slug: category.slug ?? "",
        descriptionEn: category.descriptionEn ?? "",
        descriptionBn: category.descriptionBn ?? "",
        image: category.image ?? "",
        parentId: category.parentId ?? "",
        order: category.order ?? 0,
        status: (category.status as "active" | "inactive") ?? "active",
        featured: category.featured ?? false,
        metaTitleEn: category.metaTitleEn ?? "",
        metaTitleBn: category.metaTitleBn ?? "",
        metaDescriptionEn: category.metaDescriptionEn ?? "",
        metaDescriptionBn: category.metaDescriptionBn ?? "",
      });
      setSlugManuallyEdited(true);
    } else {
      setForm({ ...emptyForm });
      setSlugManuallyEdited(false);
    }
    setSeoOpen(false);
    setTimeout(() => nameRef.current?.focus(), 100);
  }, [open, currentKey]);

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

  const handleNameChange = (value: string) => {
    setForm((p) => ({ ...p, nameEn: value }));
    if (!slugManuallyEdited) {
      setForm((p) => ({ ...p, nameEn: value, slug: slugify(value) }));
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm((p) => ({ ...p, image: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const updateField = (key: keyof CategoryFormData, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nameEn.trim() || !form.slug.trim()) return;
    await onSubmit(form);
  };

  const filteredParents = parentOptions.filter(
    (p) => !category || p.id !== category.id,
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/80 data-[state=open]:animate-fade-in" />
        <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-dialog data-[state=open]:animate-scale-in">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <Dialog.Title className="text-base font-semibold text-foreground">
              {isEditing ? "Edit Category" : "Create Category"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-6">
            {/* Image */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">Category Image</label>
              <div className="flex items-start gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-border bg-background overflow-hidden">
                  {form.image ? (
                    <img src={form.image} alt="Category" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={form.image}
                    onChange={(e) => updateField("image", e.target.value)}
                    placeholder="https://cdn.qaidilife.com/images/category.jpg"
                  />
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }} />
                  </label>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name (English) *" value={form.nameEn} onChange={(e) => handleNameChange(e.target.value)} ref={nameRef} />
              <Input label="Name (Bengali)" value={form.nameBn} onChange={(e) => updateField("nameBn", e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <Input label="Slug *" value={form.slug} onChange={(e) => { setSlugManuallyEdited(true); updateField("slug", e.target.value); }} />
                <Hash className="absolute right-3 top-1/2 mt-3 h-4 w-4 text-muted-foreground/40" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">Order</label>
                <input type="number" value={form.order} onChange={(e) => updateField("order", parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10" min="0" />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">
                Description (English)
                <textarea value={form.descriptionEn} onChange={(e) => updateField("descriptionEn", e.target.value)}
                  className="min-h-[80px] rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none resize-y focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">
                Description (Bengali)
                <textarea value={form.descriptionBn} onChange={(e) => updateField("descriptionBn", e.target.value)}
                  className="min-h-[80px] rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none resize-y focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10" />
              </label>
            </div>

            {/* Parent & Status */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">
                Parent Category
                <select value={form.parentId} onChange={(e) => updateField("parentId", e.target.value)}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10">
                  <option value="">None (Top Level)</option>
                  {filteredParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {"—".repeat(p.depth)}{p.depth > 0 ? " " : ""}{p.nameEn}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">
                Status
                <select value={form.status} onChange={(e) => updateField("status", e.target.value as "active" | "inactive")}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => updateField("featured", e.target.checked)}
                    className="h-4 w-4 rounded border-border text-foreground focus:ring-foreground/20" />
                  <span className="text-xs font-medium text-foreground">Featured Category</span>
                </label>
              </div>
            </div>

            {/* SEO */}
            <div>
              <button onClick={() => setSeoOpen(!seoOpen)}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium hover:text-foreground transition">
                <Globe className="h-3.5 w-3.5" />
                SEO Settings
                <span className="ml-1 text-muted-foreground/50">{seoOpen ? "▲" : "▼"}</span>
              </button>
              {seoOpen && (
                <div className="mt-4 space-y-4 border border-border rounded-xl p-4 bg-background/50">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Meta Title (English)" value={form.metaTitleEn} onChange={(e) => updateField("metaTitleEn", e.target.value)}
                      placeholder={form.nameEn || "Leave blank to use category name"} />
                    <Input label="Meta Title (Bengali)" value={form.metaTitleBn} onChange={(e) => updateField("metaTitleBn", e.target.value)}
                      placeholder={form.nameBn || "Leave blank to use category name"} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">
                      Meta Description (English)
                      <textarea value={form.metaDescriptionEn} onChange={(e) => updateField("metaDescriptionEn", e.target.value)}
                        className="min-h-[60px] rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none resize-y focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10"
                        placeholder="Brief description for search engines" maxLength={160} />
                      <span className="text-[10px] text-muted-foreground/60 text-right">{form.metaDescriptionEn.length}/160</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">
                      Meta Description (Bengali)
                      <textarea value={form.metaDescriptionBn} onChange={(e) => updateField("metaDescriptionBn", e.target.value)}
                        className="min-h-[60px] rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none resize-y focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10" maxLength={160} />
                      <span className="text-[10px] text-muted-foreground/60 text-right">{form.metaDescriptionBn.length}/160</span>
                    </label>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1">Preview</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                      {form.metaTitleEn || form.nameEn || "Category Title"} | QAIDILife
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {form.metaDescriptionEn || form.descriptionEn || "Browse our collection of " + (form.nameEn || "products") + "."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-card px-6 py-4">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={loading}>Cancel</Button>
            </Dialog.Close>
            <Button size="sm" onClick={handleSubmit} disabled={loading || !form.nameEn.trim() || !form.slug.trim()}>
              {loading ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
