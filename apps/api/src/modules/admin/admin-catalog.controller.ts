import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { AdminGuard } from "./admin.guard";
import { AdminCatalogService } from "./admin-catalog.service";

const categorySchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameBn: z.string().optional().default(""),
  slug: z.string().min(1, "Slug is required"),
  descriptionEn: z.string().nullable().optional().default(""),
  descriptionBn: z.string().nullable().optional().default(""),
  parentId: z.string().nullable().optional(),
  image: z.string().nullable().optional().default(""),
  order: z.number().int().optional().default(0),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  featured: z.boolean().optional().default(false),
  metaTitleEn: z.string().nullable().optional().default(""),
  metaTitleBn: z.string().nullable().optional().default(""),
  metaDescriptionEn: z.string().nullable().optional().default(""),
  metaDescriptionBn: z.string().nullable().optional().default(""),
});

const categoryUpdateSchema = categorySchema.partial();

const productSchema = z.object({
  titleEn: z.string().min(1),
  titleBn: z.string().optional().default(""),
  slug: z.string().min(1),
  descriptionEn: z.string().optional().default(""),
  descriptionBn: z.string().optional().default(""),
  primaryImage: z.string().min(1, "Primary image is required"),
  gallery: z.array(z.union([z.string(), z.object({ url: z.string(), variantIds: z.array(z.string()) })])).optional().default([]),
  price: z.number().gt(0, "Price must be greater than 0"),
  compareAt: z.number().nullable().optional(),
  currency: z.string().optional().default("BDT"),
  variants: z.array(z.object({
    sku: z.string().min(1),
    size: z.string().optional().default(""),
    color: z.string().optional().default(""),
    stock: z.number().int().optional().default(0),
    price: z.number(),
    compareAt: z.number().nullable().optional(),
    image: z.string().nullable().optional(),
    weight: z.number().nullable().optional(),
    barcode: z.string().nullable().optional(),
    lowStockThreshold: z.number().int().nullable().optional(),
    enabled: z.boolean().optional().default(true),
    sortOrder: z.number().int().optional().default(0),
  })),
  categoryIds: z.array(z.string()).optional().default([]),
});

const productUpdateSchema = productSchema.partial();

@Controller("admin/catalog")
@UseGuards(AdminGuard)
export class AdminCatalogController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  // ── Categories ──────────────────────────────────────────

  @Get("categories")
  async listCategories(
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("featured") featured?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: string,
    @Query("parentId") parentId?: string,
  ) {
    return this.adminCatalogService.listCategories({
      search,
      status,
      featured: featured === "true" ? true : featured === "false" ? false : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
      sort,
      parentId,
    });
  }

  @Get("categories/tree")
  async getCategoryTree() {
    return this.adminCatalogService.getCategoryTree();
  }

  @Get("categories/:id")
  async getCategory(@Param("id") id: string) {
    return this.adminCatalogService.getCategory(id);
  }

  @Post("categories")
  async createCategory(@Body() body: unknown) {
    const parsed = categorySchema.parse(body);
    return this.adminCatalogService.createCategory(parsed);
  }

  @Patch("categories/reorder")
  async reorderCategories(@Body() body: { orders: Array<{ id: string; order: number }> }) {
    const parsed = z.object({
      orders: z.array(z.object({ id: z.string(), order: z.number().int() })),
    }).parse(body);
    return this.adminCatalogService.reorderCategories(parsed.orders);
  }

  @Patch("categories/:id")
  async updateCategory(@Param("id") id: string, @Body() body: unknown) {
    const parsed = categoryUpdateSchema.parse(body);
    return this.adminCatalogService.updateCategory(id, parsed);
  }

  @Patch("categories/:id/status")
  async toggleCategoryStatus(@Param("id") id: string, @Body() body: { status: string }) {
    const parsed = z.object({ status: z.enum(["active", "inactive"]) }).parse(body);
    return this.adminCatalogService.updateCategory(id, parsed);
  }

  @Delete("categories/:id")
  async deleteCategory(@Param("id") id: string) {
    try {
      await this.adminCatalogService.deleteCategory(id);
    } catch (err) {
      if (err instanceof Error) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  @Post("categories/bulk-delete")
  async bulkDeleteCategories(@Body() body: { ids: string[] }) {
    const parsed = z.object({ ids: z.array(z.string()).min(1) }).parse(body);
    return this.adminCatalogService.bulkDeleteCategories(parsed.ids);
  }

  // ── Products ────────────────────────────────────────────

  @Get("products")
  async listProducts() {
    return this.adminCatalogService.listProducts();
  }

  @Get("products/:id")
  async getProduct(@Param("id") id: string) {
    return this.adminCatalogService.getProduct(id);
  }

  @Post("products")
  async createProduct(@Body() body: unknown) {
    const parsed = productSchema.parse(body);
    return this.adminCatalogService.createProduct(parsed);
  }

  @Patch("products/:id")
  async updateProduct(@Param("id") id: string, @Body() body: unknown) {
    const parsed = productUpdateSchema.parse(body);
    return this.adminCatalogService.updateProduct(id, parsed);
  }

  @Delete("products/:id")
  async deleteProduct(@Param("id") id: string) {
    await this.adminCatalogService.deleteProduct(id);
  }
}
