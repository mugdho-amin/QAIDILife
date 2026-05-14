import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

/** Props for the product grid. */
export interface ProductGridProps {
  /** Products to render. */
  products: Product[];
}

/** Responsive product grid for PLP and homepage. */
export function ProductGrid({ products }: ProductGridProps) {
  const cards: JSX.Element[] = [];
  for (const product of products) {
    cards.push(<ProductCard key={product.id} product={product} />);
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {cards}
    </div>
  );
}
