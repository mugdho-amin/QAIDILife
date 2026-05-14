import { Controller, Get, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { CatalogService } from "./catalog.service";

const listSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  price_min: z.coerce.number().optional(),
  price_max: z.coerce.number().optional(),
  sort: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().optional(),
});

/** Catalog endpoints for categories and products. */
@Controller()
export class CatalogController {
  /** Create a catalog controller. */
  constructor(private readonly catalogService: CatalogService) {}

  /** List categories. */
  @Get("categories")
  async listCategories() {
    return this.catalogService.listCategories();
  }

  /** List products with filters. */
  @Get("products")
  async listProducts(@Query() query: Record<string, string>) {
    const parsed = listSchema.parse(query);
    return this.catalogService.listProducts({
      size: parsed.size,
      color: parsed.color,
      priceMin: parsed.price_min,
      priceMax: parsed.price_max,
      sort: parsed.sort,
      cursor: parsed.cursor,
      limit: parsed.limit,
    });
  }

  /** Get a single product. */
  @Get("products/:id")
  async getProduct(@Param("id") id: string) {
    return this.catalogService.getProduct(id);
  }
}
