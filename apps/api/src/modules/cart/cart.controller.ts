import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { z } from "zod";
import type { Response } from "express";
import { CartService } from "./cart.service";

const addSchema = z.object({
  cart_id: z.string().optional(),
  product_id: z.string().min(1),
  variant_id: z.string().min(1),
  qty: z.number().min(1),
}).transform((data) => ({
  cartId: data.cart_id,
  productId: data.product_id,
  variantId: data.variant_id,
  qty: data.qty,
}));

const updateSchema = z.object({
  qty: z.number().min(0),
});

@ApiTags("Cart")
@Controller()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get("cart")
  @ApiOperation({ summary: "Get or create cart" })
  async getCart(
    @Headers("x-cart-id") cartId: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cart = await this.cartService.getCart(cartId);
    response.setHeader("x-cart-id", cart.id);
    return cart;
  }

  @Post("cart/items")
  @ApiOperation({ summary: "Add item to cart" })
  async addItem(
    @Body() body: unknown,
    @Headers("x-cart-id") cartId: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const parsed = addSchema.parse(body);
    const cart = await this.cartService.addItem({
      cartId: parsed.cartId ?? cartId,
      productId: parsed.productId,
      variantId: parsed.variantId,
      qty: parsed.qty,
    });
    response.setHeader("x-cart-id", cart.id);
    return cart;
  }

  @Patch("cart/items/:id")
  @ApiOperation({ summary: "Update cart item quantity" })
  async updateItem(@Param("id") id: string, @Body() body: unknown) {
    const parsed = updateSchema.parse(body);
    return this.cartService.updateItem(id, parsed.qty);
  }

  @Delete("cart/items/:id")
  @HttpCode(204)
  @ApiOperation({ summary: "Remove item from cart" })
  async removeItem(@Param("id") id: string) {
    await this.cartService.removeItem(id);
  }
}
