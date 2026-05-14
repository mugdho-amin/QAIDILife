"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { getApiClient } from "@/lib/api";
import { featuredProducts } from "@/lib/mock-data";
import { ProductGrid } from "./ProductGrid";
import type { ProductFilters } from "./FilterDrawer";

/** Props for the product feed. */
export interface ProductFeedProps {
  /** Active filters. */
  filters: ProductFilters;
  /** Active sort key. */
  sort?: string;
  /** Callback for list meta updates. */
  onMetaChange?: (meta: {
    count: number;
    hasMore: boolean;
    loading: boolean;
    usingFallback: boolean;
  }) => void;
}

/** Infinite product feed for PLP. */
export function ProductFeed({ filters, sort, onMetaChange }: ProductFeedProps) {
  const [items, setItems] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const itemsRef = useRef<Product[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /** Sync local ref with state items. */
  const syncItemsRef = () => {
    itemsRef.current = items;
  };

  useEffect(syncItemsRef, [items]);

  /** Reset pagination state. */
  const resetPagination = () => {
    itemsRef.current = [];
    setItems([]);
    setCursor(null);
    setHasMore(true);
  };

  /** Build query params for API call. */
  const buildQuery = (cursorOverride?: string | null) => {
    const query: Record<string, string | number> = {};
    if (filters.size) {
      query.size = filters.size;
    }
    if (filters.color) {
      query.color = filters.color;
    }
    if (filters.priceMin) {
      query.price_min = filters.priceMin;
    }
    if (filters.priceMax) {
      query.price_max = filters.priceMax;
    }
    if (sort) {
      query.sort = sort;
    }
    const effectiveCursor =
      cursorOverride === undefined ? cursor : cursorOverride;
    if (effectiveCursor) {
      query.cursor = effectiveCursor;
    }
    query.limit = 8;
    return query;
  };

  /** Append products to the current list. */
  const appendProducts = (nextItems: Product[], nextCursor?: string | null) => {
    const merged = [...itemsRef.current, ...nextItems];
    setItems(merged);
    setCursor(nextCursor ?? null);
    setHasMore(Boolean(nextCursor));
  };

  /** Fetch products from the API with fallback data. */
  const fetchProducts = async (reset = false) => {
    if (loading || (!hasMore && !reset) || (useFallback && !reset)) {
      return;
    }
    setLoading(true);
    try {
      const client = getApiClient();
      const response = await client.listProducts(
        buildQuery(reset ? null : undefined),
      );
      if (reset) {
        itemsRef.current = response.items ?? [];
        setItems(response.items ?? []);
        setCursor(response.next_cursor ?? null);
        setHasMore(Boolean(response.next_cursor));
      } else {
        appendProducts(response.items, response.next_cursor ?? null);
      }
      setUseFallback(false);
    } catch {
      setUseFallback(true);
      setHasMore(false);
      setCursor(null);
    } finally {
      setLoading(false);
    }
  };

  /** Handle intersection observer updates. */
  const handleIntersect = (entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];
    if (entry?.isIntersecting) {
      fetchProducts();
    }
  };

  /** Disconnect observer during cleanup. */
  const disconnectObserver = (observer: IntersectionObserver) => {
    observer.disconnect();
  };

  /** Trigger product fetch when sentinel is visible. */
  const observeSentinel = () => {
    if (!sentinelRef.current || !hasMore) {
      return;
    }
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(sentinelRef.current);
    /** Cleanup observer on unmount. */
    const cleanup = () => {
      disconnectObserver(observer);
    };
    return cleanup;
  };

  useEffect(observeSentinel, [sentinelRef, hasMore, cursor, loading, useFallback]);

  /** Reload products when filters or sort change. */
  useEffect(() => {
    resetPagination();
    setUseFallback(false);
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  /** Determine whether a product matches active filters. */
  const matchesFilters = (product: Product) => {
    if (filters.size) {
      const matches = product.variants?.some(
        (variant) => variant.size === filters.size,
      );
      if (!matches) {
        return false;
      }
    }
    if (filters.color) {
      const matches = product.variants?.some(
        (variant) => variant.color === filters.color,
      );
      if (!matches) {
        return false;
      }
    }
    const price = product.price?.amount ?? 0;
    if (filters.priceMin !== undefined && price < filters.priceMin) {
      return false;
    }
    if (filters.priceMax !== undefined && price > filters.priceMax) {
      return false;
    }
    return true;
  };

  /** Sort products for client-side fallbacks. */
  const sortItems = (list: Product[]) => {
    if (sort === "price_asc") {
      return [...list].sort(
        (a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0),
      );
    }
    if (sort === "price_desc") {
      return [...list].sort(
        (a, b) => (b.price?.amount ?? 0) - (a.price?.amount ?? 0),
      );
    }
    return list;
  };

  const sourceItems = useFallback ? featuredProducts : items;
  const visibleItems = sortItems(sourceItems.filter(matchesFilters));
  const visibleCount = visibleItems.length;

  useEffect(() => {
    onMetaChange?.({
      count: visibleCount,
      hasMore,
      loading,
      usingFallback: useFallback,
    });
  }, [visibleCount, hasMore, loading, useFallback, onMetaChange]);

  return (
    <div className="space-y-8">
      {visibleItems.length > 0 ? (
        <ProductGrid products={visibleItems} />
      ) : !loading ? (
        <div className="rounded border border-[#e5dfd9] bg-white px-6 py-10 text-center text-sm text-ink/60">
          No products found. Try adjusting your filters.
        </div>
      ) : null}
      <div ref={sentinelRef} className="h-10" />
      {loading ? (
        <div className="h-10 w-full rounded-full bg-mist" />
      ) : null}
    </div>
  );
}
