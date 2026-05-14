import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    variants: true;
    categories: { include: { category: true } };
  };
}>;

/** Admin catalog service for product and category CRUD. */
@Injectable()
export class AdminCatalogService {
  /** Create admin catalog service. */
  constructor(private readonly prisma: PrismaService) {}

  /** List all products with variants and categories. */
  async listProducts() {
    const products: ProductWithRelations[] = await this.prisma.product.findMany({
      include: {
        variants: true,
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return products.map((product) => this.mapProduct(product));
  }

  /** Get a single product by id. */
  async getProduct(id: string) {
    const product: ProductWithRelations | null =
      await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        categories: { include: { category: true } },
      },
      });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return this.mapProduct(product);
  }

  /** Create a new product. */
  async createProduct(input: {
    titleEn: string;
    titleBn: string;
    slug: string;
    descriptionEn: string;
    descriptionBn: string;
    primaryImage: string;
    gallery: string[];
    price: number;
    compareAt?: number | null;
    currency?: string;
    variants: Array<{
      sku: string;
      size: string;
      color: string;
      stock: number;
      price: number;
    }>;
    categoryIds?: string[];
  }) {
    const product: ProductWithRelations = await this.prisma.product.create({
      data: {
        titleEn: input.titleEn,
        titleBn: input.titleBn,
        slug: input.slug,
        descriptionEn: input.descriptionEn,
        descriptionBn: input.descriptionBn,
        primaryImage: input.primaryImage,
        gallery: input.gallery,
        price: input.price,
        compareAt: input.compareAt ?? undefined,
        currency: input.currency ?? "BDT",
        variants: {
          create: input.variants.map((variant) => ({
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            price: variant.price,
          })),
        },
        categories: input.categoryIds?.length
          ? {
              create: input.categoryIds.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
      },
      include: {
        variants: true,
        categories: { include: { category: true } },
      },
    });
    return this.mapProduct(product);
  }

  /** Update an existing product. */
  async updateProduct(
    id: string,
    input: Partial<{
      titleEn: string;
      titleBn: string;
      slug: string;
      descriptionEn: string;
      descriptionBn: string;
      primaryImage: string;
      gallery: string[];
      price: number;
      compareAt?: number | null;
      currency?: string;
      variants: Array<{
        sku: string;
        size: string;
        color: string;
        stock: number;
        price: number;
      }>;
      categoryIds: string[];
    }>,
  ) {
    const data: Record<string, unknown> = {
      titleEn: input.titleEn,
      titleBn: input.titleBn,
      slug: input.slug,
      descriptionEn: input.descriptionEn,
      descriptionBn: input.descriptionBn,
      primaryImage: input.primaryImage,
      price: input.price,
      compareAt: input.compareAt ?? undefined,
      currency: input.currency ?? undefined,
    };
    if (input.gallery) {
      data.gallery = input.gallery;
    }
    if (input.variants) {
      await this.prisma.cartItem.deleteMany({
        where: { variant: { productId: id } },
      });
      data.variants = {
        deleteMany: {},
        create: input.variants.map((variant) => ({
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          price: variant.price,
        })),
      };
    }
    if (input.categoryIds?.length) {
      data.categories = {
        deleteMany: {},
        create: input.categoryIds.map((categoryId) => ({
          category: { connect: { id: categoryId } },
        })),
      };
    }
    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
        categories: { include: { category: true } },
      },
    }) as ProductWithRelations;
    return this.mapProduct(product);
  }

  /** Delete a product. */
  async deleteProduct(id: string) {
    await this.prisma.product.delete({ where: { id } });
  }

  /** List categories. */
  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { nameEn: "asc" } });
  }

  /** Create a category. */
  async createCategory(input: { nameEn: string; nameBn: string; slug: string }) {
    return this.prisma.category.create({
      data: {
        nameEn: input.nameEn,
        nameBn: input.nameBn,
        slug: input.slug,
      },
    });
  }

  /** Update a category. */
  async updateCategory(id: string, input: Partial<{ nameEn: string; nameBn: string; slug: string }>) {
    return this.prisma.category.update({
      where: { id },
      data: {
        nameEn: input.nameEn,
        nameBn: input.nameBn,
        slug: input.slug,
      },
    });
  }

  /** Delete a category. */
  async deleteCategory(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }

  /** Map product to admin response. */
  private mapProduct(product: ProductWithRelations) {
    return {
      id: product.id,
      slug: product.slug,
      titleEn: product.titleEn,
      titleBn: product.titleBn,
      descriptionEn: product.descriptionEn,
      descriptionBn: product.descriptionBn,
      primaryImage: product.primaryImage,
      gallery: this.normalizeGallery(product.gallery),
      price: product.price,
      compareAt: product.compareAt,
      currency: product.currency,
      variants: product.variants,
      categories: product.categories.map((item) => item.category),
      createdAt: product.createdAt.toISOString(),
    };
  }

  /** Normalize gallery values across providers. */
  private normalizeGallery(gallery: unknown) {
    if (Array.isArray(gallery)) {
      return gallery.map((item) => String(item));
    }
    if (typeof gallery === "string") {
      try {
        const parsed = JSON.parse(gallery) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item));
        }
      } catch {
        return [gallery];
      }
      return [gallery];
    }
    return [];
  }

}
