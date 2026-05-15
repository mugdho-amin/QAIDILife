import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../prisma/generated-client";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache.service";
import { mapProduct, seedCategories, seedProducts } from "./catalog.seed";

type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true; categories: { include: { category: true } } };
}>;

const CACHE_TTL = 300;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async listCategories() {
    const cacheKey = "catalog:categories";
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    let categories = await this.prisma.category.findMany().catch(() => null);
    if (!categories || categories.length === 0) {
      return seedCategories;
    }

    const mapped = categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name_en: c.nameEn,
      name_bn: c.nameBn,
      parent_id: c.parentId,
    }));

    await this.cache.set(cacheKey, mapped, CACHE_TTL);
    return mapped;
  }

  async listProducts(params: {
    size?: string;
    color?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: string;
    cursor?: string;
    limit?: number;
    search?: string;
  }) {
    const limit = Math.min(params.limit ?? 20, 100);
    const where: Prisma.ProductWhereInput = { published: true };

    if (params.priceMin || params.priceMax) {
      where.price = {
        gte: params.priceMin ?? undefined,
        lte: params.priceMax ?? undefined,
      };
    }
    if (params.size || params.color) {
      where.variants = {
        some: {
          ...(params.size ? { size: params.size } : {}),
          ...(params.color ? { color: params.color } : {}),
        },
      };
    }
    if (params.search) {
      where.OR = [
        { titleEn: { contains: params.search } },
        { titleBn: { contains: params.search } },
        { descriptionEn: { contains: params.search } },
        { descriptionBn: { contains: params.search } },
      ];
    }

    const orderBy = this.resolveSort(params.sort);
    const products = await this.prisma.product.findMany({
      where,
      include: { variants: true, categories: { include: { category: true } } },
      take: limit,
      skip: params.cursor ? 1 : 0,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy,
    });

    const items = products.map((p) => mapProduct(p, p.variants));
    const nextCursor = products.length === limit ? products.at(-1)?.id : null;
    return { items, next_cursor: nextCursor ?? null };
  }

  async getProduct(idOrSlug: string) {
    const cacheKey = `catalog:product:${idOrSlug}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], published: true },
      include: { variants: true, categories: { include: { category: true } } },
    });

    if (!product) return null;

    const result = mapProduct(product, product.variants);
    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async invalidateProductCache(idOrSlug: string) {
    await this.cache.del(`catalog:product:${idOrSlug}`);
    await this.cache.del("catalog:categories");
    await this.cache.delPattern("catalog:products:*");
  }

  private resolveSort(sort?: string): Prisma.ProductOrderByWithRelationInput {
    if (sort === "price_asc") return { price: "asc" };
    if (sort === "price_desc") return { price: "desc" };
    if (sort === "name_asc") return { titleEn: "asc" };
    if (sort === "name_desc") return { titleEn: "desc" };
    if (sort === "oldest") return { createdAt: "asc" };
    return { createdAt: "desc" };
  }
}
