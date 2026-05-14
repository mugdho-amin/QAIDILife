import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
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
  search: z.string().optional(),
});

@ApiTags("Catalog")
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  @SkipThrottle()
  @ApiOperation({ summary: "List all categories" })
  async listCategories() {
    return this.catalog.listCategories();
  }

  @Get("products")
  @SkipThrottle()
  @ApiOperation({ summary: "List/search products with cursor pagination" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "sort", required: false, enum: ["newest", "price_asc", "price_desc", "name_asc", "name_desc"] })
  async listProducts(@Query() query: Record<string, string>) {
    const parsed = listSchema.parse(query);
    return this.catalog.listProducts({
      size: parsed.size,
      color: parsed.color,
      priceMin: parsed.price_min,
      priceMax: parsed.price_max,
      sort: parsed.sort,
      cursor: parsed.cursor,
      limit: parsed.limit,
      search: parsed.search,
    });
  }

  @Get("products/:id")
  @SkipThrottle()
  @ApiOperation({ summary: "Get product by ID or slug" })
  async getProduct(@Param("id") id: string) {
    return this.catalog.getProduct(id);
  }
}
