import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    variants: true;
    categories: { include: { category: true } };
  };
}>;

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts() {
    const products: ProductWithRelations[] = await this.prisma.product.findMany(
      {
        include: {
          variants: true,
          categories: { include: { category: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    );
    return products.map((product) => this.mapProduct(product));
  }

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
      throw new NotFoundException('Product not found');
    }
    return this.mapProduct(product);
  }

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
      compareAt?: number | null;
      image?: string;
      weight?: number | null;
      barcode?: string;
      lowStockThreshold?: number;
      enabled?: boolean;
      sortOrder?: number;
    }>;
    categoryIds?: string[];
  }) {
    const product = await this.prisma.product.create({
      data: {
        titleEn: input.titleEn,
        titleBn: input.titleBn,
        slug: input.slug,
        descriptionEn: input.descriptionEn,
        descriptionBn: input.descriptionBn,
        primaryImage: input.primaryImage,
        gallery: JSON.stringify(input.gallery),
        price: input.price,
        compareAt: input.compareAt,
        currency: input.currency ?? 'BDT',
        published: true,
        variants: {
          create: input.variants.map((variant, idx) => ({
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            price: variant.price,
            compareAt: variant.compareAt,
            image: variant.image,
            weight: variant.weight,
            barcode: variant.barcode,
            lowStockThreshold: variant.lowStockThreshold ?? 5,
            enabled: variant.enabled ?? true,
            sortOrder: variant.sortOrder ?? idx,
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
    }) as unknown as ProductWithRelations;
    return this.mapProduct(product);
  }

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
        compareAt?: number | null;
        image?: string;
        weight?: number | null;
        barcode?: string;
        lowStockThreshold?: number;
        enabled?: boolean;
        sortOrder?: number;
      }>;
      categoryIds: string[];
    }>,
  ) {
    const data: Record<string, unknown> = {};
    if (input.titleEn !== undefined) data.titleEn = input.titleEn;
    if (input.titleBn !== undefined) data.titleBn = input.titleBn;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.descriptionEn !== undefined) data.descriptionEn = input.descriptionEn;
    if (input.descriptionBn !== undefined) data.descriptionBn = input.descriptionBn;
    if (input.primaryImage !== undefined) data.primaryImage = input.primaryImage;
    if (input.gallery !== undefined) data.gallery = input.gallery;
    if (input.price !== undefined) data.price = input.price;
    if (input.compareAt !== undefined) data.compareAt = input.compareAt;
    if (input.currency !== undefined) data.currency = input.currency;

    if (input.categoryIds !== undefined) {
      data.categories = {
        deleteMany: {},
        create: input.categoryIds.map((categoryId) => ({
          category: { connect: { id: categoryId } },
        })),
      };
    }

    if (input.variants !== undefined) {
      const existing = await this.prisma.variant.findMany({
        where: { productId: id },
        select: { id: true, sku: true },
      });
      const existingMap = new Map(existing.map((v) => [v.sku, v.id]));
      const incomingSkus = new Set(input.variants!.map((v) => v.sku));

      const toDelete = existing.filter((v) => !incomingSkus.has(v.sku)).map((v) => v.id);
      const toCreate: typeof input.variants = [];
      const toUpdate: Array<{ id: string; data: (typeof input.variants)[0] }> = [];

      for (const variant of input.variants) {
        const existingId = existingMap.get(variant.sku);
        if (existingId) {
          toUpdate.push({ id: existingId, data: variant });
        } else {
          toCreate.push(variant);
        }
      }

      const operations: Record<string, unknown> = {};

      if (toDelete.length > 0) {
        await this.prisma.cartItem.deleteMany({
          where: { variantId: { in: toDelete } },
        });
        operations.deleteMany = { id: { in: toDelete } };
      }

      if (toCreate.length > 0) {
        operations.create = toCreate.map((variant, idx) => ({
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          price: variant.price,
          compareAt: variant.compareAt,
          image: variant.image,
          weight: variant.weight,
          barcode: variant.barcode,
          lowStockThreshold: variant.lowStockThreshold ?? 5,
          enabled: variant.enabled ?? true,
          sortOrder: variant.sortOrder ?? idx,
        }));
      }

      for (const update of toUpdate) {
        await this.prisma.variant.update({
          where: { id: update.id },
          data: {
            size: update.data.size,
            color: update.data.color,
            stock: update.data.stock,
            price: update.data.price,
            compareAt: update.data.compareAt,
            image: update.data.image,
            weight: update.data.weight,
            barcode: update.data.barcode,
            lowStockThreshold: update.data.lowStockThreshold ?? 5,
            enabled: update.data.enabled ?? true,
            sortOrder: update.data.sortOrder ?? 0,
          },
        });
      }

      if (Object.keys(operations).length > 0) {
        data.variants = operations;
      }
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

  async deleteProduct(id: string) {
    await this.prisma.product.delete({ where: { id } });
  }

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { nameEn: 'asc' } });
  }

  async createCategory(input: {
    nameEn: string;
    nameBn: string;
    slug: string;
  }) {
    return this.prisma.category.create({
      data: {
        nameEn: input.nameEn,
        nameBn: input.nameBn,
        slug: input.slug,
      },
    });
  }

  async updateCategory(
    id: string,
    input: Partial<{ nameEn: string; nameBn: string; slug: string }>,
  ) {
    return this.prisma.category.update({
      where: { id },
      data: {
        nameEn: input.nameEn,
        nameBn: input.nameBn,
        slug: input.slug,
      },
    });
  }

  async deleteCategory(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }

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
      variants: [...product.variants].sort((a, b) => a.sortOrder - b.sortOrder),
      categories: product.categories.map((item) => item.category),
      createdAt: product.createdAt.toISOString(),
    };
  }

  private normalizeGallery(gallery: unknown) {
    if (Array.isArray(gallery)) {
      return gallery.map((item) => String(item));
    }
    if (typeof gallery === 'string') {
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
