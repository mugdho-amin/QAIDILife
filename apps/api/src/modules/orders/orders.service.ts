import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/** Orders service for user history. */
@Injectable()
export class OrdersService {
  /** Create orders service. */
  constructor(private readonly prisma: PrismaService) {}

  /** List orders for user. */
  async listOrders(userId?: string) {
    if (!userId) {
      return [];
    }
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    const mapped = [] as ReturnType<typeof this.mapOrder>[];
    for (const order of orders) {
      mapped.push(this.mapOrder(order));
    }
    return mapped;
  }

  /** Get a single order. */
  async getOrder(userId: string | undefined, id: string) {
    if (!userId) {
      throw new NotFoundException("Order not found");
    }
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return this.mapOrder(order);
  }

  /** Map order to API response. */
  private mapOrder(order: {
    id: string;
    status: string;
    phone: string;
    shippingZone: string;
    shippingFee: number;
    subtotal: number;
    total: number;
    createdAt: Date;
    items: Array<{
      id: string;
      productId: string;
      variantId: string;
      qty: number;
      price: number;
      titleEn: string;
      titleBn: string;
      image: string;
    }>;
  }) {
    const items = [] as Array<{
      id: string;
      product_id: string;
      variant_id: string;
      title_en: string;
      title_bn: string;
      image: string;
      qty: number;
      unit_price: { currency: "BDT"; amount: number };
      line_total: { currency: "BDT"; amount: number };
    }>;
    for (const item of order.items) {
      const lineTotal = item.price * item.qty;
      items.push({
        id: item.id,
        product_id: item.productId,
        variant_id: item.variantId,
        title_en: item.titleEn,
        title_bn: item.titleBn,
        image: item.image,
        qty: item.qty,
        unit_price: { currency: "BDT", amount: item.price },
        line_total: { currency: "BDT", amount: lineTotal },
      });
    }
    return {
      id: order.id,
      status: order.status,
      phone: order.phone,
      items,
      shipping: {
        zone: order.shippingZone,
        fee: { currency: "BDT", amount: order.shippingFee },
      },
      subtotal: { currency: "BDT", amount: order.subtotal },
      total: { currency: "BDT", amount: order.total },
      created_at: order.createdAt.toISOString(),
    };
  }
}
