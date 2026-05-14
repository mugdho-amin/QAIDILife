import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fetchProductForSeo } from "@/lib/server-product";

/** Dynamic metadata for product pages. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductForSeo(id);
  if (!product) {
    return {
      title: "Product",
      description: "QAIDILife product detail page.",
    };
  }
  const description =
    product.description_en ?? `Shop ${product.title_en} at QAIDILife.`;
  const ogImage = `/products/${id}/opengraph-image`;

  return {
    title: product.title_en,
    description,
    openGraph: {
      title: product.title_en,
      description,
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title_en,
      description,
      images: [ogImage],
    },
  };
}

/** Layout wrapper for product detail routes. */
export default function ProductLayout({ children }: { children: ReactNode }) {
  return children;
}
