import { Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import { CheckoutService } from "./checkout.service";

const checkoutSchema = z.object({
  cart_id: z.string().min(1),
  phone: z.string().min(6),
  shipping_zone: z.enum(["INSIDE_DHAKA", "OUTSIDE_DHAKA"]),
});

/** Checkout endpoints. */
@Controller()
export class CheckoutController {
  /** Create a checkout controller. */
  constructor(private readonly checkoutService: CheckoutService) {}

  /** Create checkout summary and order. */
  @Post("checkout")
  async checkout(@Body() body: unknown) {
    const parsed = checkoutSchema.parse(body);
    return this.checkoutService.createCheckout({
      cartId: parsed.cart_id,
      phone: parsed.phone,
      shippingZone: parsed.shipping_zone,
    });
  }
}
