import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AdminGuard } from "./admin.guard";
import { AdminCatalogService } from "./admin-catalog.service";

const variantSchema = z.object({
  sku: z.string().min(1),
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
});

const productSchema = z.object({
  titleEn: z.string().min(1),
  titleBn: z.string().optional().default(""),
  slug: z.string().min(1),
  descriptionEn: z.string().optional().default(""),
  descriptionBn: z.string().optional().default(""),
  primaryImage: z.string().min(1),
  gallery: z.array(z.string()).optional().default([]),
  price: z.coerce.number().min(0),
  compareAt: z.coerce.number().nullable().optional(),
  currency: z.string().default("BDT"),
  variants: z.array(variantSchema),
  categoryIds: z.array(z.string()).optional(),
});

const productUpdateSchema = productSchema.partial();

const categorySchema = z.object({
  nameEn: z.string().min(1),
  nameBn: z.string().min(1).optional().default(""),
  slug: z.string().min(1),
});

const categoryUpdateSchema = categorySchema.partial();

/** Admin catalog endpoints. */
@Controller("admin/catalog")
@UseGuards(AdminGuard)
export class AdminCatalogController {
  /** Create admin catalog controller. */
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  /** List products. */
  @Get("products")
  async listProducts() {
    return this.adminCatalogService.listProducts();
  }

  /** Get a single product. */
  @Get("products/:id")
  async getProduct(@Param("id") id: string) {
    return this.adminCatalogService.getProduct(id);
  }

  /** Create a product. */
  @Post("products")
  async createProduct(@Body() body: unknown) {
    const parsed = productSchema.parse(body);
    return this.adminCatalogService.createProduct(parsed);
  }

  /** Update a product. */
  @Patch("products/:id")
  async updateProduct(@Param("id") id: string, @Body() body: unknown) {
    const parsed = productUpdateSchema.parse(body);
    return this.adminCatalogService.updateProduct(id, parsed);
  }

  /** Delete a product. */
  @Delete("products/:id")
  async deleteProduct(@Param("id") id: string) {
    await this.adminCatalogService.deleteProduct(id);
  }

  /** List categories. */
  @Get("categories")
  async listCategories() {
    return this.adminCatalogService.listCategories();
  }

  /** Create a category. */
  @Post("categories")
  async createCategory(@Body() body: unknown) {
    const parsed = categorySchema.parse(body);
    return this.adminCatalogService.createCategory(parsed);
  }

  /** Update a category. */
  @Patch("categories/:id")
  async updateCategory(@Param("id") id: string, @Body() body: unknown) {
    const parsed = categoryUpdateSchema.parse(body);
    return this.adminCatalogService.updateCategory(id, parsed);
  }

  /** Delete a category. */
  @Delete("categories/:id")
  async deleteCategory(@Param("id") id: string) {
    await this.adminCatalogService.deleteCategory(id);
  }
}
