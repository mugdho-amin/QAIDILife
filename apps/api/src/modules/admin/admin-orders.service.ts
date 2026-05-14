import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/** Admin order service for fulfillment management. */
@Injectable()
export class AdminOrdersService {
  /** Create admin orders service. */
  constructor(private readonly prisma: PrismaService) {}

  /** List all orders. */
  async listOrders() {
    const orders = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => this.mapOrder(order));
  }

  /** Fetch a single order by id. */
  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return this.mapOrder(order);
  }

  /** Update order status. */
  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return this.mapOrder(order);
  }

  /** Map prisma order to admin response. */
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
      titleEn: string;
      titleBn: string;
      qty: number;
      price: number;
      image: string;
    }>;
  }) {
    return {
      id: order.id,
      status: order.status,
      phone: order.phone,
      shippingZone: order.shippingZone,
      shippingFee: order.shippingFee,
      subtotal: order.subtotal,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        titleEn: item.titleEn,
        titleBn: item.titleBn,
        qty: item.qty,
        price: item.price,
        image: item.image,
      })),
    };
  }
}
