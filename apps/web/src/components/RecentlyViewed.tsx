"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { readRecentlyViewed } from "@/lib/recently-viewed";

/** Props for RecentlyViewed. */
export interface RecentlyViewedProps {
  /** Section title override. */
  title?: string;
}

/** Recently viewed product rail. */
export function RecentlyViewed({ title = "Recently Viewed" }: RecentlyViewedProps) {
  const [items, setItems] = useState<Product[]>([]);

  /** Load items from local storage. */
  const loadItems = () => {
    setItems(readRecentlyViewed());
  };

  useEffect(loadItems, []);

  if (items.length === 0) {
    return null;
  }

  const cards: JSX.Element[] = [];
  for (const item of items) {
    cards.push(
      <div key={item.id} className="min-w-[180px] max-w-[180px]">
        <div className="overflow-hidden rounded-md border border-[#e5dfd9] bg-white">
          <div className="relative aspect-[3/4] w-full bg-[#f7f4f1]">
            <Image
              src={item.primary_image}
              alt={item.title_en}
              fill
              sizes="180px"
              className="object-cover"
            />
          </div>
          <div className="p-3 text-sm">
            <div className="line-clamp-2 text-[13px] font-medium text-ink">
              {item.title_en}
            </div>
            <div className="mt-2 flex gap-1 text-[11px] text-[#f0b400]">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={`${item.id}-recent-star-${index}`} aria-hidden="true">
                  {"\u2605"}
                </span>
              ))}
            </div>
            <div className="mt-2 text-sm text-[#b07a5a]">
              {"\u09F3"}
              {item.price.amount.toLocaleString("en-BD")}
            </div>
          </div>
        </div>
      </div>,
    );
  }

  return (
    <section className="mt-16">
      <div className="px-4 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink/70">
            {title}
          </h3>
        </div>
      </div>
      <div className="mt-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] gap-4">{cards}</div>
      </div>
    </section>
  );
}
