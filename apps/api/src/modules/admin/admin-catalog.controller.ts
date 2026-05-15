import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { AdminGuard } from "./admin.guard";
import { AdminCatalogService } from "./admin-catalog.service";

const categorySchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameBn: z.string().optional().default(""),
  slug: z.string().min(1, "Slug is required"),
  descriptionEn: z.string().optional(),
  descriptionBn: z.string().optional(),
  parentId: z.string().optional(),
  image: z.string().optional(),
  order: z.number().int().optional(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  featured: z.boolean().optional().default(false),
  metaTitleEn: z.string().optional(),
  metaTitleBn: z.string().optional(),
  metaDescriptionEn: z.string().optional(),
  metaDescriptionBn: z.string().optional(),
});

const categoryUpdateSchema = categorySchema.partial();

const productSchema = z.object({
  titleEn: z.string().min(1),
  titleBn: z.string(),
  slug: z.string().min(1),
  descriptionEn: z.string(),
  descriptionBn: z.string(),
  primaryImage: z.string(),
  gallery: z.array(z.string()),
  price: z.number(),
  compareAt: z.number().optional(),
  currency: z.string().optional(),
  variants: z.array(z.object({
    sku: z.string().min(1),
    size: z.string(),
    color: z.string(),
    stock: z.number().int(),
    price: z.number(),
    compareAt: z.number().optional(),
    image: z.string().optional(),
    weight: z.number().optional(),
    barcode: z.string().optional(),
    lowStockThreshold: z.number().int().optional(),
    enabled: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })),
  categoryIds: z.array(z.string()).optional(),
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
