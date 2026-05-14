import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { mapProduct, seedCategories, seedProducts } from "./catalog.seed";

type ProductWithVariants = Prisma.ProductGetPayload<{ include: { variants: true } }>;

/** Catalog service for products and categories. */
@Injectable()
export class CatalogService {
  /** Create a catalog service. */
  constructor(private readonly prisma: PrismaService) {}

  /** List product categories. */
  async listCategories() {
    type CategoryShape = {
      id: string;
      slug: string;
      nameEn: string;
      nameBn: string;
    };
    let categories: CategoryShape[] = [];
    try {
      categories = await this.prisma.category.findMany();
    } catch {
      return seedCategories;
    }
    if (categories.length === 0) {
      return seedCategories;
    }
    const mapped: {
      id: string;
      slug: string;
      name_en: string;
      name_bn: string;
    }[] = [];
    for (const category of categories) {
      mapped.push({
        id: category.id,
        slug: category.slug,
        name_en: category.nameEn,
        name_bn: category.nameBn,
      });
    }
    return mapped;
  }

  /** List products with filters and cursor pagination. */
  async listProducts(params: {
    size?: string;
    color?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = params.limit ?? 20;
    const where: Record<string, unknown> = {};
    if (params.priceMin || params.priceMax) {
      where.price = {
        gte: params.priceMin ?? undefined,
        lte: params.priceMax ?? undefined,
      };
    }
    if (params.size || params.color) {
      where.variants = {
        some: {
          size: params.size ?? undefined,
          color: params.color ?? undefined,
        },
      };
    }
    const orderBy = this.resolveSort(params.sort);
    let products: ProductWithVariants[] = [];
    try {
      products = await this.prisma.product.findMany({
        where,
        include: { variants: true },
        take: limit,
        skip: params.cursor ? 1 : 0,
        cursor: params.cursor ? { id: params.cursor } : undefined,
        orderBy,
      });
    } catch {
      return { items: seedProducts, next_cursor: null };
    }
    if (products.length === 0) {
      return { items: seedProducts, next_cursor: null };
    }
    const items = [] as ReturnType<typeof mapProduct>[];
    for (const product of products) {
      items.push(mapProduct(product, product.variants));
    }
    const nextCursor = products.length === limit ? products.at(-1)?.id : null;
    return { items, next_cursor: nextCursor ?? null };
  }

  /** Fetch a product by id or slug. */
  async getProduct(idOrSlug: string) {
    let product: ProductWithVariants | null = null;
    try {
      product = await this.prisma.product.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
        include: { variants: true },
      });
    } catch {
      product = null;
    }
    if (!product) {
      for (const item of seedProducts) {
        if (item.id === idOrSlug || item.slug === idOrSlug) {
          return item;
        }
      }
      return null;
    }
    return mapProduct(product, product.variants);
  }

  /** Resolve sort order. */
  private resolveSort(
    sort?: string,
  ): Prisma.ProductOrderByWithRelationInput {
    const desc = "desc" as Prisma.SortOrder;
    const asc = "asc" as Prisma.SortOrder;
    if (sort === "price_asc") {
      return { price: asc };
    }
    if (sort === "price_desc") {
      return { price: desc };
    }
    return { createdAt: desc };
  }
}
