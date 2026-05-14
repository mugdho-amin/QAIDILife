import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { variants: true, categories: { include: { category: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");

    try {
      return await this.prisma.wishlistItem.create({
        data: { userId, productId },
        include: { product: true },
      });
    } catch (err: any) {
      if (err?.code === "P2002") throw new ConflictException("Already in wishlist");
      throw err;
    }
  }

  async remove(userId: string, productId: string) {
    try {
      await this.prisma.wishlistItem.delete({
        where: { userId_productId: { userId, productId } },
      });
    } catch (err: any) {
      if (err?.code === "P2025") throw new NotFoundException("Not in wishlist");
      throw err;
    }
  }
}
