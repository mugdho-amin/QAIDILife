"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Tag } from "@/components/Tag";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CategoryFormModal } from "@/components/CategoryFormModal";
import type { CategoryFormData } from "@/components/CategoryFormModal";
import { useNotification } from "@refinedev/core";
import {
  Plus, Search, SlidersHorizontal, ChevronDown, ChevronRight,
  Trash2, Download, Upload, Star,
  FolderTree, Table2, RefreshCw, X, SquareStack,
  Layers, AlertTriangle, FileJson, FileSpreadsheet,
} from "lucide-react";

import type { AdminCategory, AdminCategoryTreeNode } from "@/lib/types";
import { readAdminToken } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://localhost:4000";

// ── Helpers ───────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function buildTree(flat: AdminCategory[]): AdminCategoryTreeNode[] {
  const map = new Map<string, AdminCategoryTreeNode>();
  const roots: AdminCategoryTreeNode[] = [];

  for (const cat of flat) {
    map.set(cat.id, { ...cat, children: [] });
  }
  for (const cat of flat) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function flattenTree(nodes: AdminCategoryTreeNode[], depth = 0): Array<AdminCategoryTreeNode & { depth: number }> {
  const result: Array<AdminCategoryTreeNode & { depth: number }> = [];
  for (const node of nodes) {
    result.push({ ...node, depth });
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

// ── API Helpers ──────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = readAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let msg: string;
    try {
      const p = JSON.parse(body);
      msg = p.error?.message ?? p.message ?? `API error (${res.status})`;
    } catch {
      msg = body || `API error (${res.status})`;
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return (body?.data ?? body) as T;
}

// ── Status Config ────────────────────────────────────────

const STATUS_CONFIG = {
  active: { label: "Active", variant: "success" as const },
  inactive: { label: "Inactive", variant: "danger" as const },
};

// ── Component ────────────────────────────────────────────

export default function CategoriesPage() {
  // Data state
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState("order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { open } = useNotification();
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Data Loading ──────────────────────────────────────

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (featuredFilter) params.set("featured", featuredFilter);
      params.set("sort", `${sortField}:${sortDir}`);
      params.set("limit", "200");

      const result = await apiFetch<{
        data: AdminCategory[];
        total: number;
      }>(`/v1/admin/catalog/categories?${params.toString()}`);

      setCategories(result.data ?? []);
      setTotalCount(result.total ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load categories";
      setError(msg);
      open?.({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, featuredFilter, sortField, sortDir, open]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadCategories();
    }, 400);
  };

  // ── Derived Data ──────────────────────────────────────

  const sortedCategories = useMemo(() => {
    const sorted = [...categories].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "nameEn": cmp = a.nameEn.localeCompare(b.nameEn); break;
        case "nameBn": cmp = a.nameBn.localeCompare(b.nameBn); break;
        case "slug": cmp = a.slug.localeCompare(b.slug); break;
        case "order": cmp = a.order - b.order; break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "productCount": cmp = a.productCount - b.productCount; break;
        case "createdAt": cmp = a.createdAt.localeCompare(b.createdAt); break;
        default: cmp = a.order - b.order;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return sorted;
  }, [categories, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter((c) => c.status === "active").length,
    inactive: categories.filter((c) => c.status === "inactive").length,
    featured: categories.filter((c) => c.featured).length,
  }), [categories]);

  const treeData = useMemo(() => buildTree(sortedCategories), [sortedCategories]);
  const parentOptions = useMemo(() =>
    flattenTree(treeData).map((c) => ({
      id: c.id,
      nameEn: c.nameEn,
      nameBn: c.nameBn,
      depth: c.depth,
    })),
  [treeData]);

  const allSelected = sortedCategories.length > 0 && selectedIds.size === sortedCategories.length;

  // ── Sorting ───────────────────────────────────────────

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />;
    return sortDir === "asc"
      ? <ChevronDown className="h-3 w-3" />
      : <ChevronUpIcon className="h-3 w-3" />;
  };

  // ── CRUD Operations ───────────────────────────────────

  const handleCreate = async (data: CategoryFormData) => {
    setFormLoading(true);
    try {
      await apiFetch("/v1/admin/catalog/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setFormModalOpen(false);
      open?.({ type: "success", message: "Category created" });
      loadCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      open?.({ type: "error", message: msg });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CategoryFormData) => {
    if (!editingCategory) return;
    setFormLoading(true);
    try {
      await apiFetch(`/v1/admin/catalog/categories/${editingCategory.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setFormModalOpen(false);
      setEditingCategory(null);
      open?.({ type: "success", message: "Category updated" });
      loadCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update category";
      open?.({ type: "error", message: msg });
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (category: AdminCategory) => {
    setEditingCategory(category);
    setFormModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/v1/admin/catalog/categories/${deletingId}`, {
        method: "DELETE",
      });
      open?.({ type: "success", message: "Category deleted" });
      setConfirmOpen(false);
      setDeletingId(null);
      loadCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      open?.({ type: "error", message: msg });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const result = await apiFetch<{ deleted: number; errors: string[] }>(
        "/v1/admin/catalog/categories/bulk-delete",
        { method: "POST", body: JSON.stringify({ ids: Array.from(selectedIds) }) },
      );
      if (result.errors.length > 0) {
        open?.({ type: "error", message: `${result.deleted} deleted. Errors: ${result.errors.join(", ")}` });
      } else {
        open?.({ type: "success", message: `${result.deleted} categories deleted` });
      }
      setSelectedIds(new Set());
      setConfirmOpen(false);
      loadCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bulk delete failed";
      open?.({ type: "error", message: msg });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await apiFetch(`/v1/admin/catalog/categories/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      open?.({ type: "success", message: `Category ${newStatus === "active" ? "activated" : "deactivated"}` });
      loadCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      open?.({ type: "error", message: msg });
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await apiFetch(`/v1/admin/catalog/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ featured: !current }),
      });
      open?.({ type: "success", message: current ? "Removed from featured" : "Marked as featured" });
      loadCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update";
      open?.({ type: "error", message: msg });
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string | number) => {
    try {
      await apiFetch(`/v1/admin/catalog/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
      open?.({ type: "success", message: "Category updated" });
      loadCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update";
      open?.({ type: "error", message: msg });
    }
  };

  // ── Selection ─────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedCategories.map((c) => c.id)));
    }
  };

  // ── Import ────────────────────────────────────────────

  const importCategoriesFromFile = async (file: File | undefined, format: "csv" | "json") => {
    if (!file) return;
    try {
      const text = await file.text();
      let records: Array<{ nameEn: string; nameBn?: string; slug?: string; status?: string }> = [];
      if (format === "json") {
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) { open?.({ type: "error", message: "CSV must have a header row and at least one data row" }); return; }
        const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
        const nameIdx = headers.indexOf("nameen") ?? headers.indexOf("name_en") ?? headers.indexOf("name") ?? -1;
        const bnIdx = headers.indexOf("namebn") ?? headers.indexOf("name_bn") ?? -1;
        const slugIdx = headers.indexOf("slug") ?? -1;
        if (nameIdx === -1) { open?.({ type: "error", message: "CSV must have a 'nameEn' column" }); return; }
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.replace(/"/g, "").trim());
          records.push({
            nameEn: cols[nameIdx] ?? "",
            nameBn: bnIdx >= 0 ? cols[bnIdx] ?? "" : "",
            slug: slugIdx >= 0 ? cols[slugIdx] ?? "" : "",
          });
        }
      }
      let created = 0; let errors = 0;
      for (const rec of records) {
        if (!rec.nameEn) { errors++; continue; }
        try {
          await apiFetch("/v1/admin/catalog/categories", {
            method: "POST",
            body: JSON.stringify({
              nameEn: rec.nameEn, nameBn: rec.nameBn ?? "",
              slug: rec.slug || rec.nameEn.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, ""),
              status: rec.status || "active",
            }),
          });
          created++;
        } catch { errors++; }
      }
      open?.({ type: "success", message: `${created} categories imported${errors ? `, ${errors} failed` : ""}` });
      loadCategories();
    } catch (err) {
      open?.({ type: "error", message: "Failed to import file" });
    }
  };

  // ── Export ────────────────────────────────────────────

  const exportCSV = () => {
    const headers = ["Name (EN)", "Name (BN)", "Slug", "Status", "Featured", "Order", "Products", "Created"];
    const rows = sortedCategories.map((c) => [
      c.nameEn, c.nameBn, c.slug, c.status, c.featured ? "Yes" : "No",
      c.order, c.productCount, c.createdAt,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `categories-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    open?.({ type: "success", message: "Categories exported" });
  };

  const exportJSON = () => {
    const json = JSON.stringify(sortedCategories, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `categories-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    open?.({ type: "success", message: "Categories exported" });
  };

  // ── Keyboard Shortcuts ────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        openCreateModal();
      }
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const active = document.activeElement;
        if (active?.tagName !== "INPUT" && active?.tagName !== "TEXTAREA") {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Tree Expand/Collapse ──────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(sortedCategories.map((c) => c.id)));
  const collapseAll = () => setExpandedIds(new Set());
  const expandedRef = useRef(false);

  // Auto-expand tree on first switch to tree view
  useEffect(() => {
    if (viewMode === "tree" && !expandedRef.current && sortedCategories.length > 0) {
      expandedRef.current = true;
      expandAll();
    }
    if (viewMode === "table") {
      expandedRef.current = false;
    }
  }, [viewMode, sortedCategories.length]);

  // ── Render ────────────────────────────────────────────

  return (
    <AdminGate>
      <AdminShell>
        {/* Header */}
        <PageHeader
          title="Categories"
          subtitle="Organize your product catalog with hierarchical categories, SEO metadata, and visibility controls."
          actions={
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-text-muted mr-1">
                <kbd className="rounded-md border border-mist px-1.5 py-0.5 text-[10px] font-mono">Ctrl+N</kbd>
              </span>
              <Button onClick={openCreateModal}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />New Category
              </Button>
            </div>
          }
        />

        {/* Stats Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: "text-ink" },
            { label: "Active", value: stats.active, color: "text-emerald-600" },
            { label: "Inactive", value: stats.inactive, color: "text-danger" },
            { label: "Featured", value: stats.featured, color: "text-amber-500" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-mist bg-panel px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">{stat.label}</p>
              <p className={`mt-1 text-2xl font-semibold font-display ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/50" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search categories... (press /)"
              className="w-full rounded-xl border border-mist bg-panel pl-10 pr-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 placeholder:text-text-muted/50 transition"
            />
            {search && (
              <button onClick={() => { setSearch(""); loadCategories(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-ink transition">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-mist bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 min-w-[120px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="rounded-xl border border-mist bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/30 focus:ring-1 focus:ring-ink/10 min-w-[120px]"
          >
            <option value="">All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>

          <div className="flex items-center rounded-xl border border-mist bg-panel overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn("px-3 py-2.5 text-sm transition", viewMode === "table" ? "bg-ink text-canvas" : "text-text-muted hover:text-ink")}
              title="Table View"
            >
              <Table2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={cn("px-3 py-2.5 text-sm transition", viewMode === "tree" ? "bg-ink text-canvas" : "text-text-muted hover:text-ink")}
              title="Tree View"
            >
              <FolderTree className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => loadCategories()} className="rounded-xl border border-mist bg-panel p-2.5 text-text-muted hover:text-ink hover:bg-accent-soft transition" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="relative group">
              <button className="rounded-xl border border-mist bg-panel p-2.5 text-text-muted hover:text-ink hover:bg-accent-soft transition" title="Export">
                <Download className="h-4 w-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block group-focus-within:block z-20 min-w-[160px]">
                <div className="bg-panel border border-mist rounded-xl shadow-lg p-1.5 space-y-0.5">
                  <button onClick={exportCSV} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent-soft transition">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-text-muted" /> Export CSV
                  </button>
                  <button onClick={exportJSON} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent-soft transition">
                    <FileJson className="h-3.5 w-3.5 text-text-muted" /> Export JSON
                  </button>
                </div>
              </div>
            </div>
            <div className="relative group">
              <button className="rounded-xl border border-mist bg-panel p-2.5 text-text-muted hover:text-ink hover:bg-accent-soft transition" title="Import">
                <Upload className="h-4 w-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block group-focus-within:block z-20 min-w-[160px]">
                <div className="bg-panel border border-mist rounded-xl shadow-lg p-1.5 space-y-0.5">
                  <label className="flex cursor-pointer items-center gap-2 w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent-soft transition">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-text-muted" /> Import CSV
                    <input type="file" accept=".csv" className="hidden" onChange={(e) => { importCategoriesFromFile(e.target.files?.[0], "csv"); e.target.value = ""; }} />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent-soft transition">
                    <FileJson className="h-3.5 w-3.5 text-text-muted" /> Import JSON
                    <input type="file" accept=".json" className="hidden" onChange={(e) => { importCategoriesFromFile(e.target.files?.[0], "json"); e.target.value = ""; }} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-mist bg-accent-soft/50 px-4 py-2.5 animate-fade-in">
            <span className="text-sm text-ink font-medium">
              <SquareStack className="h-4 w-4 inline mr-1.5" />
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                <X className="h-3.5 w-3.5 mr-1" />Clear
              </Button>
              <Button variant="danger" size="sm" onClick={() => { setBulkDeleting(false); setConfirmOpen(true); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
              </Button>
            </div>
          </div>
        )}

        {/* Tree View toolbar */}
        {viewMode === "tree" && sortedCategories.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-text-muted" />
            <button onClick={expandAll} className="text-xs text-text-muted hover:text-ink transition">Expand All</button>
            <span className="text-text-muted/30">|</span>
            <button onClick={collapseAll} className="text-xs text-text-muted hover:text-ink transition">Collapse All</button>
          </div>
        )}

        {/* Content Area */}
        <div className="mt-4">
          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-mist bg-panel p-5 animate-shimmer">
                  <div className="h-10 w-10 rounded-xl bg-mist/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-mist/50" />
                    <div className="h-3 w-1/5 rounded bg-mist/30" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-mist/50" />
                  <div className="h-6 w-16 rounded-full bg-mist/30" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-mist bg-panel p-12 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-sm font-semibold text-ink">Failed to Load</h3>
              <p className="mt-2 text-sm text-text-secondary max-w-sm">{error}</p>
              <Button variant="outline" className="mt-6" onClick={loadCategories}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry
              </Button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && sortedCategories.length === 0 && (
            <EmptyState
              title="No categories found"
              description={search || statusFilter || featuredFilter
                ? "Try adjusting your search or filter criteria."
                : "Create your first category to organize the product catalog."}
              icon={<FolderTree className="h-6 w-6" />}
              action={
                search || statusFilter || featuredFilter ? (
                  <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter(""); setFeaturedFilter(""); loadCategories(); }}>
                    <X className="h-3.5 w-3.5 mr-1.5" />Clear Filters
                  </Button>
                ) : (
                  <Button onClick={openCreateModal}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />Create Category
                  </Button>
                )
              }
            />
          )}

          {/* Table View */}
          {!loading && !error && sortedCategories.length > 0 && viewMode === "table" && (
            <div className="overflow-hidden rounded-2xl border border-mist bg-panel shadow-sm">
              {/* Table Header */}
              <div className="border-b border-mist bg-accent-soft/50">
                <div className="grid grid-cols-12 gap-2 px-4 py-3">
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-mist text-ink focus:ring-ink/20"
                    />
                  </div>
                  {[
                    { key: "nameEn", label: "Category", span: 3 },
                    { key: "nameBn", label: "Bengali", span: 2 },
                    { key: "slug", label: "Slug", span: 2 },
                    { key: "status", label: "Status", span: 1 },
                    { key: "productCount", label: "Products", span: 1 },
                    { key: "order", label: "Order", span: 1 },
                  ].map((col) => (
                    <div key={col.key} className={`col-span-${col.span}`}>
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="group flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-text-muted font-medium hover:text-ink transition"
                      >
                        {col.label}
                        <SortIcon field={col.key} />
                      </button>
                    </div>
                  ))}
                  <div className="col-span-1" />
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-mist/50">
                {sortedCategories.map((category) => {
                  const statusCfg = STATUS_CONFIG[category.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;
                  return (
                    <div
                      key={category.id}
                      className={cn(
                        "grid grid-cols-12 gap-2 px-4 py-3 text-sm transition-colors hover:bg-accent-soft/30 animate-fade-in",
                        selectedIds.has(category.id) && "bg-accent-soft/50",
                      )}
                    >
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(category.id)}
                          onChange={() => toggleSelect(category.id)}
                          className="h-4 w-4 rounded border-mist text-ink focus:ring-ink/20"
                        />
                      </div>
                      <div className="col-span-3 flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-mist bg-canvas overflow-hidden">
                          {category.image ? (
                            <img src={category.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <FolderTree className="h-4 w-4 text-text-muted/40" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <input
                            className="w-full bg-transparent text-sm font-semibold text-ink outline-none truncate"
                            defaultValue={category.nameEn}
                            onBlur={(e) => {
                              if (e.target.value !== category.nameEn) handleInlineUpdate(category.id, "nameEn", e.target.value);
                            }}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <input
                          className="w-full bg-transparent text-sm text-text-secondary outline-none truncate"
                          defaultValue={category.nameBn}
                          onBlur={(e) => {
                            if (e.target.value !== category.nameBn) handleInlineUpdate(category.id, "nameBn", e.target.value);
                          }}
                        />
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-xs font-mono text-text-muted truncate">{category.slug}</span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <button onClick={() => handleToggleStatus(category.id, category.status)}>
                          <Tag label={statusCfg.label} variant={statusCfg.variant} />
                        </button>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <span className="text-sm text-text-secondary font-mono">{category.productCount}</span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <input
                          type="number"
                          className="w-14 bg-transparent text-sm text-text-secondary outline-none border border-transparent focus:border-mist rounded-lg px-2 py-1 text-center"
                          defaultValue={category.order}
                          min="0"
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val !== category.order) handleInlineUpdate(category.id, "order", val);
                          }}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => handleToggleFeatured(category.id, category.featured)}
                          className={cn(
                            "p-1.5 rounded-lg transition",
                            category.featured
                              ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                              : "text-text-muted/30 hover:text-amber-400 hover:bg-accent-soft",
                          )}
                          title={category.featured ? "Unmark featured" : "Mark as featured"}
                        >
                          <Star className={cn("h-3.5 w-3.5", category.featured && "fill-current")} />
                        </button>
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-1.5 rounded-lg text-text-muted/50 hover:text-ink hover:bg-accent-soft transition"
                          title="Edit"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(category.id)}
                          className="p-1.5 rounded-lg text-text-muted/30 hover:text-danger hover:bg-danger/5 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-mist bg-canvas/50 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Showing <span className="font-medium text-ink">{sortedCategories.length}</span> of <span className="font-medium text-ink">{totalCount}</span> categories
                </span>
              </div>
            </div>
          )}

          {/* Tree View */}
          {!loading && !error && sortedCategories.length > 0 && viewMode === "tree" && (
            <div className="overflow-hidden rounded-2xl border border-mist bg-panel shadow-sm">
              <div className="divide-y divide-mist/50">
                <TreeNode
                  nodes={treeData}
                  depth={0}
                  expandedIds={expandedIds}
                  selectedIds={selectedIds}
                  onToggleExpand={toggleExpand}
                  onToggleSelect={toggleSelect}
                  onEdit={openEditModal}
                  onDelete={confirmDelete}
                  onToggleStatus={handleToggleStatus}
                  onToggleFeatured={handleToggleFeatured}
                  onInlineUpdate={handleInlineUpdate}
                />
              </div>
              <div className="border-t border-mist bg-canvas/50 px-4 py-2.5">
                <span className="text-xs text-text-muted">
                  <FolderTree className="h-3 w-3 inline mr-1" />
                  {sortedCategories.length} categories in {treeData.length} root groups
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        <CategoryFormModal
          open={formModalOpen}
          onOpenChange={(open) => {
            setFormModalOpen(open);
            if (!open) setEditingCategory(null);
          }}
          onSubmit={editingCategory ? handleUpdate : handleCreate}
          category={editingCategory}
          parentOptions={parentOptions}
          loading={formLoading}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={deletingId ? "Delete Category?" : bulkDeleting ? "Delete Selected Categories?" : "Confirm"}
          description={
            deletingId
              ? "Are you sure you want to delete this category? This action cannot be undone."
              : `Are you sure you want to delete ${selectedIds.size} categories? Categories with products or subcategories will be skipped.`
          }
          confirmLabel={deletingId ? "Delete" : `Delete (${selectedIds.size})`}
          variant="danger"
          onConfirm={deletingId ? handleDelete : handleBulkDelete}
          loading={deleteLoading || bulkDeleting}
        />
      </AdminShell>
    </AdminGate>
  );
}

// ── Tree Node Component ─────────────────────────────────

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function TreeNode({
  nodes,
  depth,
  expandedIds,
  selectedIds,
  onToggleExpand,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  onInlineUpdate,
}: {
  nodes: AdminCategoryTreeNode[];
  depth: number;
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onEdit: (category: AdminCategory) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onInlineUpdate: (id: string, field: string, value: string | number) => void;
}) {
  const STATUS_CONFIG = {
    active: { label: "Active", variant: "success" as const },
    inactive: { label: "Inactive", variant: "danger" as const },
  };

  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const statusCfg = STATUS_CONFIG[node.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;

        return (
          <div key={node.id} className={cn(selectedIds.has(node.id) && "bg-accent-soft/50")}>
            <div className="flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-accent-soft/30">
              {/* Expand/Collapse */}
              <button
                onClick={() => hasChildren && onToggleExpand(node.id)}
                className={cn(
                  "flex items-center justify-center w-5 h-5 shrink-0 rounded transition",
                  hasChildren ? "text-text-muted hover:text-ink hover:bg-accent-soft" : "text-transparent cursor-default",
                )}
                style={{ marginLeft: depth * 20 }}
              >
                {hasChildren ? (
                  isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-mist" />
                )}
              </button>

              {/* Select */}
              <input
                type="checkbox"
                checked={selectedIds.has(node.id)}
                onChange={() => onToggleSelect(node.id)}
                className="h-4 w-4 rounded border-mist text-ink focus:ring-ink/20 shrink-0"
              />

              {/* Icon */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-mist bg-canvas overflow-hidden">
                {node.image ? (
                  <img src={node.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FolderTree className="h-3.5 w-3.5 text-text-muted/40" />
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <input
                  className="w-full bg-transparent text-sm font-semibold text-ink outline-none truncate"
                  defaultValue={node.nameEn}
                  onBlur={(e) => {
                    if (e.target.value !== node.nameEn) onInlineUpdate(node.id, "nameEn", e.target.value);
                  }}
                />
              </div>

              {/* Bengali */}
              <div className="hidden sm:block w-28 min-w-0">
                <input
                  className="w-full bg-transparent text-sm text-text-secondary outline-none truncate"
                  defaultValue={node.nameBn}
                  onBlur={(e) => {
                    if (e.target.value !== node.nameBn) onInlineUpdate(node.id, "nameBn", e.target.value);
                  }}
                />
              </div>

              {/* Status */}
              <button onClick={() => onToggleStatus(node.id, node.status)}>
                <Tag label={statusCfg.label} variant={statusCfg.variant} />
              </button>

              {/* Product Count */}
              <span className="hidden lg:block text-xs text-text-muted font-mono w-12 text-right">{node.productCount}</span>

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onToggleFeatured(node.id, node.featured)}
                  className={cn(
                    "p-1.5 rounded-lg transition",
                    node.featured
                      ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      : "text-text-muted/30 hover:text-amber-400 hover:bg-accent-soft",
                  )}
                  title={node.featured ? "Unmark featured" : "Mark as featured"}
                >
                  <Star className={cn("h-3.5 w-3.5", node.featured && "fill-current")} />
                </button>
                <button
                  onClick={() => onEdit(node)}
                  className="p-1.5 rounded-lg text-text-muted/50 hover:text-ink hover:bg-accent-soft transition"
                  title="Edit"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(node.id)}
                  className="p-1.5 rounded-lg text-text-muted/30 hover:text-danger hover:bg-danger/5 transition"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
              <TreeNode
                nodes={node.children}
                depth={depth + 1}
                expandedIds={expandedIds}
                selectedIds={selectedIds}
                onToggleExpand={onToggleExpand}
                onToggleSelect={onToggleSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
                onToggleFeatured={onToggleFeatured}
                onInlineUpdate={onInlineUpdate}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
