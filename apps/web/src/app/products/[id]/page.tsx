"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { ProductGallery } from "@/components/ProductGallery";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/contexts/ToastContext";
import { getApiClient } from "@/lib/api";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { featuredProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/types";

/** Props for the product detail page. */
interface ProductDetailPageProps {
  /** Route params. */
  params: Promise<{ id: string }>;
}

/** Product detail page with gallery and sticky CTA. */
export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const { add: addToCartContext, itemCount: cartCount } = useCart();
  const { has: hasWishlist, toggle: toggleWishlist } = useWishlist();
  const { show: showToast } = useToast();

  /** Find a fallback product by id or slug. */
  const findFallback = () => {
    for (const item of featuredProducts) {
      if (item.slug === id || item.id === id) {
        return item;
      }
    }
    return null;
  };

  /** Load product details from API or fallback list. */
  const loadProduct = async () => {
    try {
      const raw: any = await getApiClient().getProduct(id);
      const mapped: Product = {
        id: raw.id,
        slug: raw.slug,
        title_en: raw.titleEn ?? raw.title_en ?? "",
        title_bn: raw.titleBn ?? raw.title_bn ?? "",
        description_en: raw.descriptionEn ?? raw.description_en ?? "",
        description_bn: raw.descriptionBn ?? raw.description_bn ?? "",
        primary_image: raw.primaryImage ?? raw.primary_image ?? "",
        gallery: raw.gallery ?? [],
        price: typeof raw.price === "number" ? { currency: "BDT", amount: raw.price } : raw.price,
        compare_at: raw.compareAt ? { currency: "BDT", amount: raw.compareAt } : raw.compare_at ?? undefined,
        variants: (raw.variants ?? []).map((v: any) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.stock,
          price: typeof v.price === "number" ? { currency: "BDT", amount: v.price } : v.price,
        })),
      };
      setProduct(mapped);
      setSelectedVariantId(mapped.variants[0]?.id ?? null);
      addRecentlyViewed(mapped);
    } catch {
      const fallback = findFallback();
      if (fallback) {
        setProduct(fallback);
        setSelectedVariantId(fallback.variants[0]?.id ?? null);
        addRecentlyViewed(fallback);
      }
    }
  };

  /** Initialize product load. */
  const initLoad = () => {
    void loadProduct();
  };

  useEffect(initLoad, [id]);

  /** Add the selected variant to cart. */
  const handleAddToCart = async () => {
    if (!product) { showToast("Product not available", "error"); return; }
    if (!selectedVariantId) { showToast("Please select a size", "error", "Choose a size before adding to cart"); return; }
    const variant = product.variants.find((v) => v.id === selectedVariantId);
    if (variant && variant.stock <= 0) { showToast("This size is out of stock", "error", "Please select a different size"); return; }
    try {
      await addToCartContext(product.id, selectedVariantId, qty);
      showToast("Added to cart", "success", `${qty} × ${product.title_en}`);
    } catch (err: any) {
      showToast("Failed to add to cart", "error", err?.message ?? "Server error, please try again");
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="px-4 py-20 sm:px-6">
          <div className="h-10 w-full rounded-full bg-mist" />
        </main>
      </div>
    );
  }

  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    product.variants[0];
  const isOutOfStock = product.variants.every((variant) => variant.stock <= 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title_en,
    image: product.gallery,
    description: product.description_en,
    sku: selectedVariant?.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: product.price.currency,
      price: product.price.amount,
      availability: isOutOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <nav className="text-sm text-[#b07a5a]">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#e5dfd9] text-[10px]">
                ⌂
              </span>
              Home
            </span>{" "}
            &gt; Panjabi &gt; {product.title_en}
          </nav>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <ProductGallery product={product} />
            <div className="space-y-4">
              <div>
                <h1 className="text-[22px] font-semibold text-ink">
                  {product.title_en}
                </h1>
                <div className="mt-2 flex items-center gap-3 text-[13px]">
                  <div className="flex gap-1 text-[#f0b400]">★★★★★</div>
                  <a href="#reviews" className="text-ink/60">
                    0 Review
                  </a>
                  <button
                    type="button"
                    className="rounded border border-[#e5dfd9] px-3 py-1 text-[12px] text-ink/70"
                  >
                    Add Review
                  </button>
                </div>
              </div>
              <div className="text-[22px] font-semibold text-[#b07a5a]">
                ৳ {product.price.amount.toLocaleString("en-BD")}
              </div>
              <div className="space-y-1 text-sm text-ink/70">
                <div>
                  Brand : <span className="text-[#b07a5a]">QAIDILife</span>
                </div>
                <div>
                  Availability :{" "}
                  <span className="text-[#b07a5a]">
                    {isOutOfStock ? "Out Of Stock" : "In Stock"}
                  </span>
                </div>
                <div>
                  SKU :{" "}
                  <span className="text-[#b07a5a]">
                    {selectedVariant?.sku ?? "N/A"}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold">Size</div>
                <div className="mt-2 flex gap-2">
                  {product.variants.map((variant) => {
                    const selected = selectedVariantId === variant.id;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariantId(selected ? null : variant.id)}
                        className={`relative h-10 min-w-[40px] border text-xs font-semibold transition-all duration-200 ${
                          selected
                            ? "border-[#b07a5a] bg-[#b07a5a] text-white shadow-sm"
                            : "border-[#e5dfd9] bg-white text-ink/60 hover:border-ink/30"
                        } ${variant.stock <= 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                        disabled={variant.stock <= 0}
                        aria-pressed={selected}
                        aria-label={`Size ${variant.size}`}
                      >
                        {variant.size}
                        {selected && (
                          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#b07a5a] text-[8px] text-white ring-2 ring-white">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeChart(true)}
                className="h-9 rounded-md bg-[#1f1f1f] px-4 text-xs font-semibold text-white"
              >
                Size Chart
              </button>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-6 rounded-full border border-[#e5dfd9] px-5 py-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                    className="text-lg text-ink/70"
                  >
                    -
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((prev) => prev + 1)}
                    className="text-lg text-ink/70"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#b07a5a] text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                  </svg>
                  Add To Cart
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <details className="group rounded-md border border-[#e5dfd9] px-4 py-3" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                    Description
                    <span className="text-ink/50 transition-transform duration-200 group-open:rotate-180">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 text-sm text-ink/70">
                    <p>{product.description_en}</p>
                    <p className="mt-2">cotton slub , 120-140 gsm</p>
                  </div>
                </details>
                <details className="group rounded-md border border-[#e5dfd9] px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                    More Information
                    <span className="text-ink/50 transition-transform duration-200 group-open:rotate-180">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 text-sm text-ink/70">
                    <p>Manufactured & Marketed by: QAIDILife</p>
                    <p>Experience Centre: Mirpur-10, Dhaka-1216.</p>
                    <p>Country of Origin: Bangladesh</p>
                  </div>
                </details>
                <details className="group rounded-md border border-[#e5dfd9] px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                    Returns & Exchange Information
                    <span className="text-ink/50 transition-transform duration-200 group-open:rotate-180">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 text-sm text-ink/70">
                    <p>
                      Inside Dhaka: Please check the product while the delivery agent is
                      at your place. If it does not meet expectations, return it on the
                      spot with delivery charges only.
                    </p>
                    <p className="mt-2">
                      Outside Dhaka: Check the product while the delivery agent is at
                      your place. Returns are accepted immediately with delivery
                      charges.
                    </p>
                    <p className="mt-2">
                      Note: Colors may vary slightly due to lighting or screen
                      settings. Discounted items are not eligible for exchange or
                      return.
                    </p>
                  </div>
                </details>
              </div>

              <div className="rounded-md border border-[#e5dfd9] px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                  Estimated Delivery Date & COD Checker
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Enter your pincode"
                    className="h-10 w-full rounded border border-[#e5dfd9] px-3 text-sm"
                  />
                  <button className="h-10 rounded bg-[#1f1f1f] px-4 text-xs font-semibold text-white">
                    Check
                  </button>
                </div>
              </div>
            </div>
          </div>

          <RecentlyViewed title="Recently Stalked" />

          <section className="mt-10" id="reviews">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink/70">
              Leave a Review
            </h2>
            <p className="mt-2 text-xs text-ink/60">
              Your email address will not be published. Required fields are marked *
            </p>
            <form className="mt-6 grid w-full gap-4 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                  Your Rating*
                </div>
                <div className="mt-2 flex gap-3 text-sm text-[#f0b400]">
                  {"★★★★★"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                  Your Name*
                </div>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="mt-2 h-11 w-full rounded border border-[#e5dfd9] px-3"
                />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                  Email*
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  className="mt-2 h-11 w-full rounded border border-[#e5dfd9] px-3"
                />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                  Your Review*
                </div>
                <textarea
                  placeholder="Your Review"
                  rows={4}
                  className="mt-2 w-full rounded border border-[#e5dfd9] px-3 py-2"
                />
              </div>
              <button className="h-11 w-48 rounded bg-[#1f1f1f] text-xs font-semibold uppercase tracking-[0.3em] text-white">
                Submit Review
              </button>
            </form>
          </section>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {showSizeChart ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">
                  Size Chart
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSizeChart(false)}
                  className="text-sm text-ink/60"
                >
                  Close
                </button>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                <div className="overflow-hidden rounded-md border border-[#e5dfd9]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f7f4f1] text-[11px] uppercase tracking-[0.2em] text-ink/60">
                      <tr>
                        <th className="px-4 py-3">Size</th>
                        <th className="px-4 py-3">Chest</th>
                        <th className="px-4 py-3">Length</th>
                        <th className="px-4 py-3">Sleeve</th>
                        <th className="px-4 py-3">Collar</th>
                      </tr>
                    </thead>
                    <tbody className="text-ink/70">
                      {[
                        ["S", "41", "27", "24", "15.5"],
                        ["M", "43", "28", "24.5", "15.5"],
                        ["L", "45", "29", "25", "16.5"],
                        ["XL", "47", "30", "25.5", "16.5"],
                        ["XXL", "49", "30.5", "26", "17.5"],
                        ["3XL", "51", "31", "26.5", "18"],
                      ].map((row) => (
                        <tr key={row[0]} className="border-t border-[#e5dfd9]">
                          {row.map((cell) => (
                            <td key={cell} className="px-4 py-3">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-md border border-[#e5dfd9] bg-[#f7f4f1] p-4 text-sm text-ink/70">
                  <div className="text-xs uppercase tracking-[0.3em] text-ink/60">
                    How to Measure
                  </div>
                  <div className="mt-4 aspect-[4/3] w-full overflow-hidden rounded bg-white">
                    <img
                      src="/images/size/how-to-measure.svg"
                      alt="How to measure"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
      <Link
        href="/checkout"
        className="fixed right-4 top-[55%] z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#b07a5a] text-white shadow-lg sm:hidden"
        aria-label="Open cart"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
        {cartCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-white">
            {cartCount}
          </span>
        ) : null}
      </Link>
      <MobileNav cartCount={cartCount} active="home" />
    </div>
  );
}
