import { Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import type { CartDto, CartItemDto } from "./cart.types";
import { calculateSubtotal } from "./cart.utils";

const CART_TTL_DAYS = 7;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(cartId?: string) {
    if (cartId) {
      const existing = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true, variant: true } } },
      });
      if (existing) {
        if (existing.expiresAt && existing.expiresAt < new Date()) {
          await this.prisma.cart.delete({ where: { id: cartId } });
        } else {
          await this.prisma.cart.update({
            where: { id: cartId },
            data: { expiresAt: new Date(Date.now() + CART_TTL_DAYS * 86400000) },
          });
          return existing;
        }
      }
    }
    return this.prisma.cart.create({
      data: { expiresAt: new Date(Date.now() + CART_TTL_DAYS * 86400000) },
      include: { items: { include: { product: true, variant: true } } },
    });
  }

  async getCart(cartId?: string): Promise<CartDto> {
    const cart = await this.getOrCreate(cartId);
    return this.mapCart(cart);
  }

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
      where: { cartId: cart.id, variantId: input.variantId },
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
    if (!updated) throw new NotFoundException("Cart not found");
    return this.mapCart(updated);
  }

  async updateItem(itemId: string, qty: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item) throw new NotFoundException("Cart item not found");
    if (qty <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
    }
    const cart = await this.prisma.cart.findUnique({
      where: { id: item.cartId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart) throw new NotFoundException("Cart not found");
    return this.mapCart(cart);
  }

  async removeItem(itemId: string) {
    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredCarts() {
    await this.prisma.cart.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }

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
    return {
      id: cart.id,
      items,
      subtotal: { currency: "BDT", amount: calculateSubtotal(subtotalInputs) },
    };
  }
}
