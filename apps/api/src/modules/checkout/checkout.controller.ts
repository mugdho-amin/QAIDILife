import { Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import { CheckoutService } from "./checkout.service";

const checkoutSchema = z.object({
  cart_id: z.string().min(1),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters"),
  delivery_notes: z.string().optional(),
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
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || undefined,
      address: parsed.address,
      deliveryNotes: parsed.delivery_notes || undefined,
      shippingZone: parsed.shipping_zone,
    });
  }
}
