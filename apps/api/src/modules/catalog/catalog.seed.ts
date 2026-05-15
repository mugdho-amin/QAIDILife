import type { Variant } from "../../../prisma/generated-client";

/** API money object. */
export interface MoneyDto {
  /** ISO currency. */
  currency: "BDT";
  /** Amount in BDT. */
  amount: number;
}

/** API product variant object. */
export interface ProductVariantDto {
  /** Variant id. */
  id: string;
  /** SKU. */
  sku: string;
  /** Size. */
  size: string;
  /** Color. */
  color: string;
  /** Stock. */
  stock: number;
  /** Price. */
  price: MoneyDto;
}

/** API product object. */
export interface ProductDto {
  /** Product id. */
  id: string;
  /** Slug. */
  slug: string;
  /** English title. */
  title_en: string;
  /** Bengali title. */
  title_bn: string;
  /** English description. */
  description_en: string;
  /** Bengali description. */
  description_bn: string;
  /** Primary image. */
  primary_image: string;
  /** Gallery. */
  gallery: string[];
  /** Price. */
  price: MoneyDto;
  /** Compare at price. */
  compare_at?: MoneyDto;
  /** Variants. */
  variants: ProductVariantDto[];
}

interface ProductModel {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  primaryImage: string;
  gallery: unknown;
  price: number;
  compareAt: number | null;
}

/** Seed categories for empty databases. */
export const seedCategories = [
  {
    id: "cat_panjabi",
    slug: "panjabi",
    name_en: "Panjabi",
    name_bn: "????????",
  },
  {
    id: "cat_tshirt",
    slug: "t-shirt",
    name_en: "T-Shirt",
    name_bn: "??-?????",
  },
  {
    id: "cat_polo",
    slug: "polo",
    name_en: "Polo",
    name_bn: "????",
  },
  {
    id: "cat_accessories",
    slug: "accessories",
    name_en: "Accessories",
    name_bn: "???????????",
  },
];

const CDN_BASE = process.env.CDN_BASE_URL ?? "https://cdn.qaidilife.com";

/** Seed products for empty databases. */
export const seedProducts: ProductDto[] = [
  {
    id: "prod_01",
    slug: "noir-panjabi",
    title_en: "Noir Panjabi",
    title_bn: "????? ????????",
    description_en: "Minimal black panjabi in premium cotton.",
    description_bn: "????????? ????? ??????? ???? ?????????",
    primary_image: `${CDN_BASE}/products/noir-panjabi.svg`,
    gallery: [
      `${CDN_BASE}/products/noir-panjabi.svg`,
      `${CDN_BASE}/products/noir-panjabi-2.svg`,
    ],
    price: { currency: "BDT", amount: 2890 },
    compare_at: { currency: "BDT", amount: 3290 },
    variants: [
      {
        id: "var_01_s_black",
        sku: "PNJ-001-S",
        size: "S",
        color: "Black",
        stock: 12,
        price: { currency: "BDT", amount: 2890 },
      },
      {
        id: "var_01_m_black",
        sku: "PNJ-001-M",
        size: "M",
        color: "Black",
        stock: 16,
        price: { currency: "BDT", amount: 2890 },
      },
    ],
  },
  {
    id: "prod_02",
    slug: "ivory-linen-shirt",
    title_en: "Ivory Linen Shirt",
    title_bn: "????? ????? ?????",
    description_en: "Relaxed linen with a crisp collar.",
    description_bn: "??????? ?????? ?????????? ??????",
    primary_image: `${CDN_BASE}/products/ivory-linen.svg`,
    gallery: [
      `${CDN_BASE}/products/ivory-linen.svg`,
      `${CDN_BASE}/products/ivory-linen-2.svg`,
    ],
    price: { currency: "BDT", amount: 2190 },
    variants: [
      {
        id: "var_02_s_ivory",
        sku: "SHR-002-S",
        size: "S",
        color: "Ivory",
        stock: 10,
        price: { currency: "BDT", amount: 2190 },
      },
    ],
  },
];

/** Map Prisma product + variants to API product. */
export const mapProduct = (
  product: ProductModel,
  variants: Variant[],
): ProductDto => {
  const mappedVariants: ProductVariantDto[] = [];
  for (const variant of variants) {
    mappedVariants.push({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      price: { currency: "BDT", amount: variant.price },
    });
  }
  return {
    id: product.id,
    slug: product.slug,
    title_en: product.titleEn,
    title_bn: product.titleBn,
    description_en: product.descriptionEn,
    description_bn: product.descriptionBn,
    primary_image: product.primaryImage,
    gallery: normalizeGallery(product.gallery),
    price: { currency: "BDT", amount: product.price },
    compare_at: product.compareAt
      ? { currency: "BDT", amount: product.compareAt }
      : undefined,
    variants: mappedVariants,
  };
};

/** Normalize gallery payloads across database providers. */
const normalizeGallery = (gallery: unknown): string[] => {
  if (Array.isArray(gallery)) {
    return gallery.map((item: unknown) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "url" in item) return (item as { url: string }).url;
      return String(item);
    });
  }
  if (typeof gallery === "string") {
    try {
      const parsed = JSON.parse(gallery) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item: unknown) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "url" in item) return (item as { url: string }).url;
          return String(item);
        });
      }
    } catch {
      return [gallery];
    }
  }
  if (gallery && typeof gallery === "object") {
    const maybeArray = (gallery as { values?: unknown }).values;
    if (Array.isArray(maybeArray)) {
      return maybeArray.map((item: unknown) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "url" in item) return (item as { url: string }).url;
        return String(item);
      });
    }
  }
  return [];
};
