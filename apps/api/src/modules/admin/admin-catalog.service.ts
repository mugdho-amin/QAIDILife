import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated-client';
import { PrismaService } from '../../prisma/prisma.service';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    variants: true;
    categories: { include: { category: true } };
  };
}>;

interface ListCategoriesOptions {
  search?: string;
  status?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  parentId?: string;
}

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
    if (input.gallery !== undefined) data.gallery = JSON.stringify(input.gallery);
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

  // ── Categories ──────────────────────────────────────────

  async listCategories(options: ListCategoriesOptions = {}) {
    const where: Record<string, unknown> = {};
    const conditions: Record<string, unknown>[] = [];

    if (options.search) {
      const s = options.search;
      conditions.push({
        OR: [
          { nameEn: { contains: s } },
          { nameBn: { contains: s } },
          { slug: { contains: s } },
          { descriptionEn: { contains: s } },
          { descriptionBn: { contains: s } },
        ],
      });
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.featured !== undefined) {
      where.featured = options.featured;
    }

    if (options.parentId !== undefined) {
      where.parentId = options.parentId === "null" ? null : options.parentId;
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    let orderBy: Record<string, string>[] = [{ order: 'asc' as const }, { nameEn: 'asc' as const }];

    if (options.sort) {
      const [field, dir] = options.sort.split(':');
      const allowedFields = ['nameEn', 'nameBn', 'slug', 'order', 'status', 'featured', 'createdAt', 'productCount'];
      if (field && allowedFields.includes(field)) {
        orderBy = [{ [field]: dir === 'desc' ? 'desc' : 'asc' }] as Record<string, string>[];
      }
    }

    const page = options.page ?? 1;
    const limit = options.limit ?? 100;
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where: where as Prisma.CategoryWhereInput,
        include: { _count: { select: { products: true, children: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.category.count({ where: where as Prisma.CategoryWhereInput }),
    ]);

    return {
      data: categories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        nameEn: cat.nameEn,
        nameBn: cat.nameBn,
        descriptionEn: cat.descriptionEn,
        descriptionBn: cat.descriptionBn,
        image: cat.image,
        order: cat.order,
        parentId: cat.parentId,
        status: cat.status,
        featured: cat.featured,
        metaTitleEn: cat.metaTitleEn,
        metaTitleBn: cat.metaTitleBn,
        metaDescriptionEn: cat.metaDescriptionEn,
        metaDescriptionBn: cat.metaDescriptionBn,
        productCount: cat._count.products,
        childrenCount: cat._count.children,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
        parent: { select: { id: true, nameEn: true, nameBn: true, slug: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return {
      id: category.id,
      slug: category.slug,
      nameEn: category.nameEn,
      nameBn: category.nameBn,
      descriptionEn: category.descriptionEn,
      descriptionBn: category.descriptionBn,
      image: category.image,
      order: category.order,
      parentId: category.parentId,
      parent: category.parent,
      status: category.status,
      featured: category.featured,
      metaTitleEn: category.metaTitleEn,
      metaTitleBn: category.metaTitleBn,
      metaDescriptionEn: category.metaDescriptionEn,
      metaDescriptionBn: category.metaDescriptionBn,
      productCount: category._count.products,
      childrenCount: category._count.children,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async getCategoryTree() {
    const categories = await this.prisma.category.findMany({
      include: { _count: { select: { products: true, children: true } } },
      orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
    });

    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const cat of categories) {
      map.set(cat.id, {
        id: cat.id,
        slug: cat.slug,
        nameEn: cat.nameEn,
        nameBn: cat.nameBn,
        image: cat.image,
        order: cat.order,
        parentId: cat.parentId,
        status: cat.status,
        featured: cat.featured,
        productCount: cat._count.products,
        childrenCount: cat._count.children,
        children: [],
      });
    }

    for (const cat of categories) {
      const node = map.get(cat.id);
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async createCategory(input: {
    nameEn: string;
    nameBn: string;
    slug: string;
    descriptionEn?: string;
    descriptionBn?: string;
    parentId?: string;
    image?: string;
    order?: number;
    status?: string;
    featured?: boolean;
    metaTitleEn?: string;
    metaTitleBn?: string;
    metaDescriptionEn?: string;
    metaDescriptionBn?: string;
  }) {
    if (input.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: input.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }
    const existing = await this.prisma.category.findUnique({ where: { slug: input.slug } });
    if (existing) throw new Error('A category with this slug already exists');
    return this.prisma.category.create({
      data: {
        nameEn: input.nameEn,
        nameBn: input.nameBn,
        slug: input.slug,
        descriptionEn: input.descriptionEn ?? null,
        descriptionBn: input.descriptionBn ?? null,
        parentId: input.parentId || null,
        image: input.image ?? null,
        order: input.order ?? 0,
        status: input.status ?? 'active',
        featured: input.featured ?? false,
        metaTitleEn: input.metaTitleEn ?? null,
        metaTitleBn: input.metaTitleBn ?? null,
        metaDescriptionEn: input.metaDescriptionEn ?? null,
        metaDescriptionBn: input.metaDescriptionBn ?? null,
      },
    });
  }

  async updateCategory(
    id: string,
    input: Partial<{
      nameEn: string;
      nameBn: string;
      slug: string;
      descriptionEn: string;
      descriptionBn: string;
      parentId?: string;
      image?: string;
      order?: number;
      status?: string;
      featured?: boolean;
      metaTitleEn?: string;
      metaTitleBn?: string;
      metaDescriptionEn?: string;
      metaDescriptionBn?: string;
    }>,
  ) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    if (input.slug && input.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: input.slug } });
      if (existing) throw new Error('A category with this slug already exists');
    }

    if (input.parentId) {
      if (input.parentId === id) throw new Error('A category cannot be its own parent');
      const isDescendant = await this.prisma.category.findFirst({
        where: { parentId: id, id: input.parentId },
      });
      if (isDescendant) throw new Error('Cannot set a descendant category as the parent');
      const parent = await this.prisma.category.findUnique({ where: { id: input.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const data: Record<string, unknown> = {};
    if (input.nameEn !== undefined) data.nameEn = input.nameEn;
    if (input.nameBn !== undefined) data.nameBn = input.nameBn;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.descriptionEn !== undefined) data.descriptionEn = input.descriptionEn;
    if (input.descriptionBn !== undefined) data.descriptionBn = input.descriptionBn;
    if (input.image !== undefined) data.image = input.image;
    if (input.order !== undefined) data.order = input.order;
    if (input.parentId !== undefined) data.parentId = input.parentId || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.metaTitleEn !== undefined) data.metaTitleEn = input.metaTitleEn;
    if (input.metaTitleBn !== undefined) data.metaTitleBn = input.metaTitleBn;
    if (input.metaDescriptionEn !== undefined) data.metaDescriptionEn = input.metaDescriptionEn;
    if (input.metaDescriptionBn !== undefined) data.metaDescriptionBn = input.metaDescriptionBn;

    return this.prisma.category.update({ where: { id }, data });
  }

  async reorderCategories(orders: Array<{ id: string; order: number }>) {
    await this.prisma.$transaction(
      orders.map((o) =>
        this.prisma.category.update({
          where: { id: o.id },
          data: { order: o.order },
        }),
      ),
    );
    return { success: true };
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category._count.children > 0) {
      throw new Error('Cannot delete category with subcategories. Remove or reassign child categories first.');
    }
    if (category._count.products > 0) {
      throw new Error('Cannot delete category with products. Remove all products from this category first.');
    }
    await this.prisma.category.delete({ where: { id } });
  }

  async bulkDeleteCategories(ids: string[]) {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids } },
      include: { _count: { select: { products: true, children: true } } },
    });

    const errors: string[] = [];
    const validIds: string[] = [];

    for (const cat of categories) {
      if (cat._count.children > 0) {
        errors.push(`"${cat.nameEn}" has subcategories`);
      } else if (cat._count.products > 0) {
        errors.push(`"${cat.nameEn}" has ${cat._count.products} products`);
      } else {
        validIds.push(cat.id);
      }
    }

    if (validIds.length > 0) {
      await this.prisma.productCategory.deleteMany({
        where: { categoryId: { in: validIds } },
      });
      await this.prisma.category.deleteMany({
        where: { id: { in: validIds } },
      });
    }

    return { deleted: validIds.length, errors };
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
      return gallery.map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'url' in item) return (item as { url: string }).url;
        return String(item);
      });
    }
    if (typeof gallery === 'string') {
      try {
        const parsed = JSON.parse(gallery) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((item: unknown) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && 'url' in item) return (item as { url: string }).url;
            return String(item);
          });
        }
      } catch {
        return [gallery];
      }
      return [gallery];
    }
    return [];
  }
}
