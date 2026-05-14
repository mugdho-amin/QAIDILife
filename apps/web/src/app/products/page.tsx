"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { FilterDrawer, type ProductFilters } from "@/components/FilterDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { ProductFeed } from "@/components/ProductFeed";
import { useCartCount } from "@/hooks/useCart";

/** Product listing page with filters and infinite scroll. */
export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [pantSize, setPantSize] = useState<string>("");
  const [priceRange, setPriceRange] = useState<string>("");
  const [sort, setSort] = useState("default");
  const [canPaginate, setCanPaginate] = useState(false);
  const [sectionOpen, setSectionOpen] = useState({
    size: true,
    pant: true,
    price: true,
  });
  const searchParams = useSearchParams();
  const cartCount = useCartCount();
  const category = searchParams.get("category") ?? "Shirts";
  const categoryLabel = useMemo(() => {
    const raw = category.replace(/-/g, " ");
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [category]);

  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const pantOptions = ["30", "32", "34", "36", "38"];
  const priceOptions = [
    { label: "Under Tk. 999", min: 0, max: 999 },
    { label: "Tk. 1000 - TK 1,499", min: 1000, max: 1499 },
    { label: "Tk. 1,500 - Tk. 1,999", min: 1500, max: 1999 },
    { label: "Tk. 2,000 - Tk. 2,999", min: 2000, max: 2999 },
  ];
  const apiSort =
    sort === "latest"
      ? "newest"
      : sort === "price_low"
        ? "price_asc"
        : sort === "price_high"
          ? "price_desc"
          : undefined;

  /** Apply updated filters. */
  const handleApply = (nextFilters: ProductFilters) => {
    setFilters(nextFilters);
  };

  const handleMetaChange = useCallback(
    (meta: { count: number; hasMore: boolean }) => {
      const next = meta.count >= 8 || meta.hasMore;
      setCanPaginate((prev) => (prev === next ? prev : next));
    },
    [],
  );

  const toggleSection = (key: "size" | "pant" | "price") => {
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 text-sm text-ink/60">
            <span className="text-ink">Home</span> &gt; {categoryLabel}
          </div>
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block">
              <div className="space-y-6 text-sm text-ink/70">
              <div className="border-b border-black/10 pb-5">
                <button
                  type="button"
                  onClick={() => toggleSection("size")}
                  aria-expanded={sectionOpen.size}
                  className="flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span>Size</span>
                  <ChevronDown
                    className={`h-5 w-5 text-ink/60 transition-transform ${
                      sectionOpen.size ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {sectionOpen.size ? (
                  <div className="facet-scroll mt-3 max-h-40 overflow-y-auto pr-2">
                    <ul className="space-y-2">
                    {sizeOptions.map((size) => (
                      <li key={size} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-[#b07a5a]"
                          checked={filters.size === size}
                          onChange={() =>
                            setFilters((prev) => ({
                              ...prev,
                              size: prev.size === size ? undefined : size,
                            }))
                          }
                        />
                        <span>{size}</span>
                      </li>
                    ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="border-b border-black/10 pb-5">
                <button
                  type="button"
                  onClick={() => toggleSection("pant")}
                  aria-expanded={sectionOpen.pant}
                  className="flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span>Pant-Size</span>
                  <ChevronDown
                    className={`h-5 w-5 text-ink/60 transition-transform ${
                      sectionOpen.pant ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {sectionOpen.pant ? (
                  <div className="facet-scroll mt-3 max-h-40 overflow-y-auto pr-2">
                    <ul className="space-y-2">
                    {pantOptions.map((size) => (
                      <li key={size} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-[#b07a5a]"
                          checked={pantSize === size}
                          onChange={() =>
                            setPantSize((prev) => (prev === size ? "" : size))
                          }
                        />
                        <span>{size}</span>
                      </li>
                    ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="border-b border-black/10 pb-5">
                <button
                  type="button"
                  onClick={() => toggleSection("price")}
                  aria-expanded={sectionOpen.price}
                  className="flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span>Price (TK)</span>
                  <ChevronDown
                    className={`h-5 w-5 text-ink/60 transition-transform ${
                      sectionOpen.price ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {sectionOpen.price ? (
                  <div className="facet-scroll mt-3 max-h-40 overflow-y-auto pr-2">
                    <ul className="space-y-2">
                    {priceOptions.map((option) => (
                      <li key={option.label} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-[#b07a5a]"
                          checked={priceRange === option.label}
                          onChange={() => {
                            if (priceRange === option.label) {
                              setPriceRange("");
                              setFilters((prev) => ({
                                ...prev,
                                priceMin: undefined,
                                priceMax: undefined,
                              }));
                              return;
                            }
                            setPriceRange(option.label);
                            setFilters((prev) => ({
                              ...prev,
                              priceMin: option.min,
                              priceMax: option.max,
                            }));
                          }}
                        />
                        <span>{option.label}</span>
                      </li>
                    ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
            <section>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-ink">
                    {categoryLabel}
                  </h1>
                  <p className="text-sm text-ink/60">
                    Showing results for {categoryLabel}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-ink/60">
                  <LayoutGrid className="h-4 w-4" />
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                      className="h-10 rounded border border-[#e5dfd9] bg-white px-3 pr-10 text-sm appearance-none"
                    >
                      <option value="default">Default Sorting</option>
                      <option value="latest">Latest</option>
                      <option value="price_low">Sort by price: low to high</option>
                      <option value="price_high">Sort by price: high to low</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/60" />
                  </div>
                </div>
              </div>
              <ProductFeed
                filters={filters}
                sort={apiSort}
                onMetaChange={handleMetaChange}
              />
              {canPaginate ? (
                <nav className="mt-10 flex justify-center">
                  <div className="flex items-center gap-2 text-sm text-ink/70">
                    <button className="flex h-9 w-9 items-center justify-center rounded border border-[#e5dfd9]">
                      &#8249;
                    </button>
                    {["1", "2", "3", "4", "...", "9", "10"].map(
                      (item, index) => {
                        const isActive = index === 0;
                        return (
                          <span
                            key={item}
                            className={
                              isActive
                                ? "flex h-9 min-w-9 items-center justify-center rounded border border-[#b07a5a] bg-[#b07a5a] px-3 text-white"
                                : "flex h-9 min-w-9 items-center justify-center rounded border border-[#e5dfd9] px-3"
                            }
                          >
                            {item}
                          </span>
                        );
                      },
                    )}
                    <button className="flex h-9 w-9 items-center justify-center rounded border border-[#e5dfd9]">
                      &#8250;
                    </button>
                  </div>
                </nav>
              ) : null}
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <FilterDrawer value={filters} onApply={handleApply} />
      <MobileNav cartCount={cartCount} active="categories" />
    </div>
  );
}

