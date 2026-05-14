import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";

/** Props for the product card. */
export interface ProductCardProps {
  /** Product data. */
  product: Product;
}

/** Minimal product card with hover zoom. */
export function ProductCard({ product }: ProductCardProps) {
  const soldOut = product.variants.every((variant) => variant.stock <= 0);

  return (
    <div className="group">
      <div className="relative overflow-hidden rounded-md border border-[#e5dfd9] bg-[#f7f4f1]">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={product.primary_image}
              alt={product.title_en}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-sm bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b07a5a]">
            Sold Out
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <h6 className="text-[13px] font-semibold text-ink">
          <Link href={`/products/${product.slug}`}>{product.title_en}</Link>
        </h6>
        <div className="flex gap-1 text-[11px] text-[#f0b400]">
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={`${product.id}-star-${index}`} aria-hidden="true">
              {"\u2605"}
            </span>
          ))}
        </div>
        <div className="text-sm text-[#b07a5a]">
          {formatPrice(product.price.amount)}
        </div>
      </div>
    </div>
  );
}

/** Format BDT prices. */
function formatPrice(amount: number) {
  return `\u09F3 ${amount.toLocaleString("en-BD")}`;
}

