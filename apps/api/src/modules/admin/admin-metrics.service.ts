import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/** Metrics service for admin dashboard. */
@Injectable()
export class AdminMetricsService {
  /** Create metrics service. */
  constructor(private readonly prisma: PrismaService) {}

  /** Compute dashboard metrics. */
  async getMetrics() {
    const [productCount, orderCount, pendingOrders, revenue] =
      await this.prisma.$transaction([
        this.prisma.product.count(),
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: "pending" } }),
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: { status: { in: ["paid", "delivered"] } },
        }),
      ]);
    return {
      productCount,
      orderCount,
      pendingOrders,
      totalRevenue: revenue._sum.total ?? 0,
    };
  }
}
