import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import { CouponService } from "./coupon.service";

const validateSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().int().min(0),
});

@ApiTags("Coupons")
@Controller("coupons")
export class CouponController {
  constructor(private readonly coupon: CouponService) {}

  @Post("validate")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Validate a coupon code" })
  async validate(@Body() body: unknown) {
    const parsed = validateSchema.parse(body);
    return this.coupon.validate(parsed.code, parsed.subtotal);
  }
}
