"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";

/** Props for the product gallery. */
export interface ProductGalleryProps {
  /** Product data with gallery images. */
  product: Product;
}

/** Responsive product gallery for PDP. */
export function ProductGallery({ product }: ProductGalleryProps) {
  const images = useMemo(() => {
    if (product.gallery.length > 0) {
      return product.gallery;
    }
    return [product.primary_image];
  }, [product.gallery, product.primary_image]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const activeSrc = images[activeIndex] ?? images[0];

  const thumbnails: JSX.Element[] = [];
  for (const [index, src] of images.entries()) {
    const isActive = index === activeIndex;
    thumbnails.push(
      <button
        key={`${src}-${index}`}
        type="button"
        onClick={() => setActiveIndex(index)}
        className={`relative h-20 w-16 overflow-hidden border bg-white ${
          isActive ? "border-[#c8b3a2]" : "border-[#e5dfd9]"
        }`}
        aria-current={isActive ? "true" : "false"}
      >
        <Image
          src={src}
          alt={`${product.title_en} thumbnail ${index + 1}`}
          fill
          sizes="64px"
          className="object-cover"
        />
      </button>,
    );
  }

  return (
    <div className="grid grid-cols-[72px_1fr] gap-3 sm:gap-4">
      <div className="facet-scroll flex max-h-[520px] flex-col gap-3 overflow-y-auto pr-1">
        {thumbnails}
      </div>
      <button
        type="button"
        onClick={() => setZoomOpen(true)}
        className="group relative aspect-[3/4] w-full overflow-hidden rounded-md bg-[#f7f4f1]"
        aria-label="Zoom product image"
      >
        <Image
          src={activeSrc}
          alt={product.title_en}
          fill
          priority
          sizes="(max-width: 1024px) 90vw, 54vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </button>
      {zoomOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setZoomOpen(false)}
          role="presentation"
        >
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
            onClick={() => setZoomOpen(false)}
          >
            Close
          </button>
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={activeSrc}
              alt={product.title_en}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
