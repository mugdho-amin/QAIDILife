import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { CartDto, CartItemDto } from "./cart.types";
import { calculateSubtotal } from "./cart.utils";

/** Cart service for managing cart state. */
@Injectable()
export class CartService {
  /** Create a cart service. */
  constructor(private readonly prisma: PrismaService) {}

  /** Get or create a cart by id. */
  async getOrCreate(cartId?: string) {
    if (cartId) {
      const existing = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true, variant: true } } },
      });
      if (existing) {
        return existing;
      }
    }
    return this.prisma.cart.create({
      data: {},
      include: { items: { include: { product: true, variant: true } } },
    });
  }

  /** Get cart DTO with subtotal. */
  async getCart(cartId?: string): Promise<CartDto> {
    const cart = await this.getOrCreate(cartId);
    return this.mapCart(cart);
  }

  /** Add an item to the cart. */
  async addItem(input: {
    cartId?: string;
    productId: string;
    variantId: string;
    qty: number;
  }) {
    const cart = await this.getOrCreate(input.cartId);
    const variant = await this.prisma.variant.findUnique({
      where: { id: input.variantId },
    });
    if (!variant) {
      throw new NotFoundException("Variant not found");
    }
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId: input.variantId,
      },
    });
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + input.qty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: input.productId,
          variantId: input.variantId,
          qty: input.qty,
          price: variant.price,
        },
      });
    }
    const updated = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!updated) {
      throw new NotFoundException("Cart not found");
    }
    return this.mapCart(updated);
  }

  /** Update cart item quantity. */
  async updateItem(itemId: string, qty: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item) {
      throw new NotFoundException("Cart item not found");
    }
    if (qty <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { qty },
      });
    }
    const cart = await this.prisma.cart.findUnique({
      where: { id: item.cartId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart) {
      throw new NotFoundException("Cart not found");
    }
    return this.mapCart(cart);
  }

  /** Remove cart item. */
  async removeItem(itemId: string) {
    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  /** Map Prisma cart to DTO. */
  private mapCart(cart: {
    id: string;
    items: Array<{
      id: string;
      qty: number;
      price: number;
      product: { id: string; titleEn: string; titleBn: string; primaryImage: string };
      variant: { id: string };
    }>;
  }): CartDto {
    const items: CartItemDto[] = [];
    const subtotalInputs: { price: number; qty: number }[] = [];
    for (const item of cart.items) {
      const lineTotal = item.price * item.qty;
      subtotalInputs.push({ price: item.price, qty: item.qty });
      items.push({
        id: item.id,
        product_id: item.product.id,
        variant_id: item.variant.id,
        title_en: item.product.titleEn,
        title_bn: item.product.titleBn,
        image: item.product.primaryImage,
        qty: item.qty,
        unit_price: { currency: "BDT", amount: item.price },
        line_total: { currency: "BDT", amount: lineTotal },
      });
    }
    const subtotal = calculateSubtotal(subtotalInputs);
    return {
      id: cart.id,
      items,
      subtotal: { currency: "BDT", amount: subtotal },
    };
  }
}
