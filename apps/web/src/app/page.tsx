"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { ProductGrid } from "@/components/ProductGrid";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { useCartCount } from "@/hooks/useCart";
import { getApiClient } from "@/lib/api";
import type { Product, Category } from "@/lib/types";

/** Home page powered by live catalog data. */
export default function HomePage() {
  const cartCount = useCartCount();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonalTab, setSeasonalTab] = useState<"new" | "trending">("new");

  useEffect(() => {
    const load = async () => {
      try {
        const client = getApiClient();
        const [productData, categoryData] = await Promise.all([
          client.listProducts({ limit: 8 }),
          client.listCategories(),
        ]);
        setProducts(productData.items ?? []);
        const raw = Array.isArray(categoryData) ? categoryData : [];
        setCategories(raw);
      } catch (err) {
        console.error("Failed to load homepage data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const seasonalProducts = useMemo(() => {
    const sorted = [...products];
    if (seasonalTab === "trending") {
      return sorted.slice(0, 4);
    }
    return sorted.slice(0, 4);
  }, [products, seasonalTab]);

  const categoryLinks = categories.slice(0, 5).map((cat) => ({
    label: cat.name_en,
    href: `/products?category=${cat.slug}`,
  }));

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main>
        {/* Hero Banner */}
        <section className="w-full border-b border-black/10 bg-[#f7f4f1]">
          <div className="relative flex h-[260px] items-center justify-center sm:h-[380px] lg:h-[480px]">
            <div className="z-10 text-center px-4">
              <p className="text-xs uppercase tracking-[0.4em] text-ink/50">
                {products.length > 0
                  ? `${products.length} Styles Available`
                  : "Premium Collection"}
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl font-display">
                {categories.length > 0
                  ? categories[0]?.name_en ?? "New Collection"
                  : "New Collection"}
              </h1>
              <Link
                href="/products"
                className="mt-6 inline-block rounded-full bg-ink px-8 py-3 text-xs uppercase tracking-[0.3em] text-white hover:bg-ink/90 transition"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </section>

        {/* Category Quick Links */}
        {categoryLinks.length > 0 && (
          <section className="px-4 py-6 sm:px-6">
            <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-ink/70">
              {categoryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded border border-[#e5dfd9] px-3 py-2 hover:border-black/20 transition"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/products"
                className="rounded border border-ink/20 px-3 py-2 hover:border-ink/50 transition"
              >
                View All
              </Link>
            </div>
          </section>
        )}

        {/* Dynamic Category Sections */}
        {categories.slice(0, 3).map((category) => {
          const catProducts = products.filter(
            (p) => (p as any).category_ids?.includes(category.id),
          );
          if (loading || catProducts.length === 0) return null;
          return (
            <SectionBlock
              key={category.id}
              title={category.name_en}
              href={`/products?category=${category.slug}`}
              products={catProducts.slice(0, 4)}
            />
          );
        })}

        {/* Seasonal Favourites */}
        {seasonalProducts.length > 0 && (
          <section className="px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-[1400px]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold uppercase tracking-[0.2em]">
                  {seasonalTab === "new" ? "Just Landed" : "Most Trending"}
                </h2>
                <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                  <button
                    type="button"
                    onClick={() => setSeasonalTab("new")}
                    className={seasonalTab === "new" ? "text-ink" : undefined}
                  >
                    New Drops
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeasonalTab("trending")}
                    className={seasonalTab === "trending" ? "text-ink" : undefined}
                  >
                    Most Trending
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <ProductGrid products={seasonalProducts} />
              </div>
            </div>
          </section>
        )}

        {/* Promo Banners */}
        {products.length > 0 && (
          <section className="px-4 py-8 sm:px-6">
            <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-2">
              {categories.slice(0, 2).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group aspect-[5/3] overflow-hidden rounded bg-[#f7f4f1] flex items-center justify-center"
                >
                  <div className="text-center p-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/50">
                      Shop
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight group-hover:underline">
                      {cat.name_en}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <RecentlyViewed title="Recently Stalked" />

        {/* Show by Category */}
        {categoryLinks.length > 0 && (
          <section className="px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-[1400px]">
              <h2 className="text-lg font-semibold uppercase tracking-[0.2em]">
                Show by Category
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {categoryLinks.slice(0, 3).map((item) => (
                  <Link
                    key={`show-${item.href}`}
                    href={item.href}
                    className="group overflow-hidden rounded border border-[#e5dfd9]"
                  >
                    <div className="aspect-[4/3] bg-[#f7f4f1] flex items-center justify-center">
                      <span className="text-xs uppercase tracking-[0.3em] text-ink/40 group-hover:text-ink/60 transition">
                        {item.label}
                      </span>
                    </div>
                    <div className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink/70">
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <MobileNav cartCount={cartCount} active="home" />
    </div>
  );
}

function SectionBlock({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: Product[];
}) {
  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold uppercase tracking-[0.2em]">
            {title}
          </h2>
          <Link
            href={href}
            className="text-xs uppercase tracking-[0.2em] text-ink/60"
          >
            View All
          </Link>
        </div>
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
