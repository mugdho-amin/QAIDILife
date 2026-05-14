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

const altAddSchema = z.object({
  cartId: z.string().optional(),
  productId: z.string().min(1),
  variantId: z.string().min(1),
  qty: z.number().min(1),
});

const updateSchema = z.object({
  qty: z.number().min(0),
});

/** Cart endpoints for QAIDILife. */
@Controller()
export class CartController {
  /** Create a cart controller. */
  constructor(private readonly cartService: CartService) {}

  /** Get current cart. */
  @Get("cart")
  async getCart(
    @Headers("x-cart-id") cartId: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cart = await this.cartService.getCart(cartId);
    response.setHeader("x-cart-id", cart.id);
    return cart;
  }

  /** Add an item to cart. */
  @Post("cart/items")
  async addItem(
    @Body() body: unknown,
    @Headers("x-cart-id") cartId: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const parsed = (() => {
      try { return addSchema.parse(body); } catch {
        return altAddSchema.parse(body);
      }
    })();
    const cart = await this.cartService.addItem({
      cartId: parsed.cartId ?? cartId,
      productId: parsed.productId,
      variantId: parsed.variantId,
      qty: parsed.qty,
    });
    response.setHeader("x-cart-id", cart.id);
    return cart;
  }

  /** Update cart item quantity. */
  @Patch("cart/items/:id")
  async updateItem(@Param("id") id: string, @Body() body: unknown) {
    const parsed = updateSchema.parse(body);
    return this.cartService.updateItem(id, parsed.qty);
  }

  /** Remove cart item. */
  @Delete("cart/items/:id")
  @HttpCode(204)
  async removeItem(@Param("id") id: string) {
    await this.cartService.removeItem(id);
  }
}
