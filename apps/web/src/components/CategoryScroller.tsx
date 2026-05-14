import Link from "next/link";
import type { Category } from "@/lib/types";

/** Props for the category scroller. */
export interface CategoryScrollerProps {
  /** Categories to render. */
  categories: Category[];
}

/** Horizontal scrolling category pills. */
export function CategoryScroller({ categories }: CategoryScrollerProps) {
  const items: JSX.Element[] = [];
  for (const category of categories) {
    items.push(
      <Link
        key={category.id}
        href={`/products?category=${category.slug}`}
        className="flex min-w-[96px] flex-col items-center gap-2"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mist text-xs uppercase tracking-[0.18em]">
          {category.name_en}
        </span>
        <span className="text-[11px] font-medium text-ink/70 font-bengali">
          {category.name_bn}
        </span>
      </Link>,
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-2 sm:px-6">
      {items}
    </div>
  );
}
