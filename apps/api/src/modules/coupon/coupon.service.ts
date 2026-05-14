import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache.service";

@Injectable()
export class CouponService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async validate(code: string, subtotal: number) {
    const cacheKey = `coupon:${code.toLowerCase()}`;
    const cached = await this.cache.get<{
      valid: boolean;
      discount: number;
      type: string;
    }>(cacheKey);
    if (cached && !cached.valid) {
      throw new NotFoundException("Invalid coupon code");
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      await this.cache.set(cacheKey, { valid: false, discount: 0, type: "" }, 300);
      throw new NotFoundException("Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw new BadRequestException("Coupon is inactive");
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException("Coupon not yet valid");
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException("Coupon has expired");
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException("Coupon usage limit reached");
    }
    if (subtotal < coupon.minOrder) {
      throw new BadRequestException(
        `Minimum order amount is ${coupon.minOrder}`,
      );
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    const result = {
      valid: true,
      code: coupon.code,
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
      discount,
      description: coupon.description,
    };
    await this.cache.set(cacheKey, result, 300);
    return result;
  }
}
