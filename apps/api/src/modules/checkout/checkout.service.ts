import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { getShippingFee, type ShippingZone } from "./shipping.utils";

/** Checkout service for totals and order creation. */
@Injectable()
export class CheckoutService {
  /** Create a checkout service. */
  constructor(private readonly prisma: PrismaService) {}

  /** Compute totals and create order. */
  async createCheckout(input: {
    cartId: string;
    phone: string;
    shippingZone: ShippingZone;
  }) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: input.cartId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart) {
      throw new NotFoundException("Cart not found");
    }
    let subtotal = 0;
    const itemsData: {
      productId: string;
      variantId: string;
      qty: number;
      price: number;
      titleEn: string;
      titleBn: string;
      image: string;
    }[] = [];
    for (const item of cart.items) {
      subtotal += item.price * item.qty;
      itemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        qty: item.qty,
        price: item.price,
        titleEn: item.product.titleEn,
        titleBn: item.product.titleBn,
        image: item.product.primaryImage,
      });
    }
    const shippingFee = getShippingFee(input.shippingZone);
    const total = subtotal + shippingFee;
    const order = await this.prisma.order.create({
      data: {
        phone: input.phone,
        shippingZone: input.shippingZone,
        shippingFee,
        subtotal,
        total,
        status: "pending",
        items: {
          create: itemsData,
        },
      },
    });
    return {
      cart_id: cart.id,
      order_id: order.id,
      shipping: {
        zone: input.shippingZone,
        fee: { currency: "BDT", amount: shippingFee },
      },
      subtotal: { currency: "BDT", amount: subtotal },
      total: { currency: "BDT", amount: total },
    };
  }
}
