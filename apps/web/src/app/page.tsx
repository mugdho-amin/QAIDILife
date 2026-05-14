"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { ProductGrid } from "@/components/ProductGrid";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { useCartCount } from "@/hooks/useCart";
import { featuredProducts } from "@/lib/mock-data";

const heroSlides = [
  "/images/banners/hero-lifestyle.svg",
  "/images/banners/hero-lifestyle.svg",
  "/images/banners/hero-lifestyle.svg",
];

const categoryLinks = [
  { label: "Shirts", href: "/products?category=shirts" },
  { label: "Pant", href: "/products?category=pant" },
  { label: "Panjabi", href: "/products?category=panjabi" },
];

/** ARJO-style homepage. */
export default function HomePage() {
  const cartCount = useCartCount();
  const [seasonalTab, setSeasonalTab] = useState<"new" | "trending">("new");

  const seasonalProducts = useMemo(() => {
    if (seasonalTab === "trending") {
      return featuredProducts.slice(1);
    }
    return featuredProducts.slice(0, 3);
  }, [seasonalTab]);

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main>
        <section className="w-full border-b border-black/10">
          <div className="relative overflow-hidden">
            <div className="flex w-full overflow-x-auto scroll-smooth">
              {heroSlides.map((slide, index) => (
                <div
                  key={`${slide}-${index}`}
                  className="min-w-full bg-[#f7f4f1]"
                >
                  <img
                    src={slide}
                    alt={`Banner ${index + 1}`}
                    className="h-[260px] w-full object-cover sm:h-[380px] lg:h-[480px]"
                  />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
              {heroSlides.map((_, index) => (
                <span
                  key={`dot-${index}`}
                  className={`h-2 w-2 rounded-full ${
                    index === 0 ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-ink/70">
            {categoryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded border border-[#e5dfd9] px-3 py-2 hover:border-black/20"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <SectionBlock title="Shirts" href="/products?category=shirts" />
        <SectionBlock title="Pant" href="/products?category=pant" />
        <SectionBlock title="Panjabi" href="/products?category=panjabi" />

        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[1400px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold uppercase tracking-[0.2em]">
                Seasonal Favs
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

        <section className="px-4 py-8 sm:px-6">
          <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-2">
            <div className="aspect-[5/3] overflow-hidden rounded bg-[#f7f4f1]">
              <img
                src="/images/banners/hero-lifestyle.svg"
                alt="Promo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="aspect-[5/3] overflow-hidden rounded bg-[#f7f4f1]">
              <img
                src="/images/banners/hero-lifestyle.svg"
                alt="Promo"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <RecentlyViewed title="Recently Stalked" />

        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[1400px]">
            <h2 className="text-lg font-semibold uppercase tracking-[0.2em]">
              Show by Category
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {categoryLinks.map((item) => (
                <Link
                  key={`show-${item.href}`}
                  href={item.href}
                  className="group overflow-hidden rounded border border-[#e5dfd9]"
                >
                  <div className="aspect-[4/3] bg-[#f7f4f1]">
                    <img
                      src="/images/banners/hero-lifestyle.svg"
                      alt={item.label}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink/70">
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav cartCount={cartCount} active="home" />
    </div>
  );
}

function SectionBlock({ title, href }: { title: string; href: string }) {
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
        <ProductGrid products={featuredProducts} />
      </div>
    </section>
  );
}
