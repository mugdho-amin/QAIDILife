import { Body, Controller, HttpCode, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { PaymentsService, PaymentProvider } from "./payments.service";

const paymentSchema = z.object({
  order_id: z.string().min(1),
  provider: z.enum(["SSLCOMMERZ", "SHURJOPAY", "COD"]),
});

/** Payment endpoints for QAIDILife. */
@Controller()
export class PaymentsController {
  /** Create a payment controller. */
  constructor(private readonly paymentsService: PaymentsService) {}

  /** Initiate payment session. */
  @Post("payments")
  async createPayment(@Body() body: unknown) {
    const parsed = paymentSchema.parse(body);
    return this.paymentsService.initiatePayment(
      parsed.order_id,
      parsed.provider as PaymentProvider,
    );
  }

  /** Handle SSLCommerz IPN. */
  @Post("webhooks/sslcommerz")
  @HttpCode(204)
  async sslcommerzWebhook(
    @Body() body: Record<string, string>,
    @Query() query: Record<string, string>,
  ) {
    await this.paymentsService.handleSslCommerzWebhook({ ...query, ...body });
  }

  /** Handle ShurjoPay IPN. */
  @Post("webhooks/shurjopay")
  @HttpCode(204)
  async shurjopayWebhook(
    @Body() body: Record<string, string>,
    @Query() query: Record<string, string>,
  ) {
    await this.paymentsService.handleShurjoPayWebhook({ ...query, ...body });
  }
}
