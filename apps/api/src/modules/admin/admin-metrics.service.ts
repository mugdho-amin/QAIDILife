import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      productCount,
      orderCount,
      pendingOrders,
      todayOrders,
      revenueAgg,
      lastMonthRevenueAgg,
      lowStockProductCount,
      activeUserGroups,
      recentOrders,
    ] = await this.prisma.$transaction([
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'pending' } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['paid', 'delivered'] } },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: ['paid', 'delivered'] },
          createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
      }),
      this.prisma.product.count({
        where: { variants: { some: { stock: { lte: 5 } } } },
      }),
      this.prisma.order.findMany({
        distinct: ['userId'],
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          userId: { not: null },
        },
        select: { userId: true },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: { take: 1 } },
      }),
    ]);

    const totalRevenue = revenueAgg._sum.total ?? 0;
    const lastMonthRevenue = lastMonthRevenueAgg._sum.total ?? 0;
    const revenueGrowth =
      lastMonthRevenue > 0
        ? Math.round(
            ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 10000,
          ) / 100
        : totalRevenue > 0
          ? 100
          : 0;

    return {
      productCount,
      orderCount,
      pendingOrders,
      totalRevenue,
      revenueGrowth,
      lowStockItems: lowStockProductCount,
      todayOrders,
      activeUsers: activeUserGroups.length,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        item: order.items[0]
          ? { titleEn: order.items[0].titleEn, titleBn: order.items[0].titleBn }
          : null,
      })),
    };
  }
}
