import type { Category, Product } from "./types";

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE_URL ?? "/images";

/** Build CDN image URL with fallback path. */
export const cdnImage = (path: string) => `${CDN_BASE}${path}`;

/** Featured category list for the homepage. */
export const featuredCategories: Category[] = [
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

/** Sample product list for UI fallbacks. */
export const featuredProducts: Product[] = [
  {
    id: "prod_01",
    slug: "noir-panjabi",
    title_en: "Noir Panjabi",
    title_bn: "????? ????????",
    description_en: "Minimal black panjabi in premium cotton.",
    description_bn: "????????? ????? ??????? ???? ?????????",
    primary_image: cdnImage("/products/noir-panjabi.svg"),
    gallery: [
      cdnImage("/products/noir-panjabi.svg"),
      cdnImage("/products/noir-panjabi-2.svg"),
      cdnImage("/products/noir-panjabi-3.svg"),
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
    primary_image: cdnImage("/products/ivory-linen.svg"),
    gallery: [
      cdnImage("/products/ivory-linen.svg"),
      cdnImage("/products/ivory-linen-2.svg"),
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
      {
        id: "var_02_m_ivory",
        sku: "SHR-002-M",
        size: "M",
        color: "Ivory",
        stock: 8,
        price: { currency: "BDT", amount: 2190 },
      },
    ],
  },
  {
    id: "prod_03",
    slug: "graphite-tee",
    title_en: "Graphite Tee",
    title_bn: "???????? ??",
    description_en: "Heavyweight tee with structured drape.",
    description_bn: "???????????? ????? ?? ???????? ???",
    primary_image: cdnImage("/products/graphite-tee.svg"),
    gallery: [
      cdnImage("/products/graphite-tee.svg"),
      cdnImage("/products/graphite-tee-2.svg"),
    ],
    price: { currency: "BDT", amount: 1190 },
    variants: [
      {
        id: "var_03_s_graphite",
        sku: "TEE-003-S",
        size: "S",
        color: "Graphite",
        stock: 22,
        price: { currency: "BDT", amount: 1190 },
      },
    ],
  },
  {
    id: "prod_04",
    slug: "obsidian-polo",
    title_en: "Obsidian Polo",
    title_bn: "????????? ????",
    description_en: "Ribbed collar polo with matte finish.",
    description_bn: "????? ????? ?? ???? ???? ?????",
    primary_image: cdnImage("/products/obsidian-polo.svg"),
    gallery: [
      cdnImage("/products/obsidian-polo.svg"),
      cdnImage("/products/obsidian-polo-2.svg"),
    ],
    price: { currency: "BDT", amount: 1790 },
    variants: [
      {
        id: "var_04_m_obsidian",
        sku: "POL-004-M",
        size: "M",
        color: "Black",
        stock: 14,
        price: { currency: "BDT", amount: 1790 },
      },
    ],
  },
];
