import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "../../prisma/prisma.service";
import {
  applyPaymentTransition,
  normalizePaymentStatus,
  type PaymentStatus,
} from "./payment-status";

/** Supported payment providers. */
export type PaymentProvider = "SSLCOMMERZ" | "SHURJOPAY" | "COD";

interface ShurjoPayVerificationRecord {
  /** ShurjoPay order id. */
  order_id?: string;
  /** Merchant order id. */
  customer_order_id?: string;
  /** Alternative camel cased merchant order id. */
  customerOrderId?: string;
  /** Status code. */
  sp_code?: number | string;
  /** Alternative camel cased status code. */
  spCode?: number | string;
  /** Amount. */
  amount?: number | string;
  /** Payable amount. */
  payable_amount?: number | string;
}

/** Payment service for gateway integrations. */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  /** Create a payment service. */
  constructor(private readonly prisma: PrismaService) {}

  /** Initiate a payment session. */
  async initiatePayment(orderId: string, provider: PaymentProvider) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (provider === "COD") {
      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          provider,
          status: "pending",
          amount: order.total,
        },
      });
      return {
        payment_id: payment.id,
        provider,
        status: "pending",
        redirect_url: null,
      };
    }
    if (provider === "SSLCOMMERZ") {
      return this.initiateSslCommerz(order.id, order.total);
    }
    return this.initiateShurjoPay(order.id, order.total);
  }

  /** Handle SSLCommerz IPN callback with verification. */
  async handleSslCommerzWebhook(payload: Record<string, string>) {
    const transactionId = this.readValue(payload, ["tran_id", "tranid", "tranId"]);
    if (!transactionId) {
      return;
    }
    const valId = this.readValue(payload, ["val_id", "valId"]);
    const validation = valId ? await this.validateSslCommerz(valId) : null;
    const statusValue = validation?.status ?? payload.status;
    const nextStatus = this.resolveSslCommerzStatus(statusValue);
    await this.upsertPaymentStatus({
      provider: "SSLCOMMERZ",
      transactionId,
      orderId: transactionId,
      amount: this.parseAmount(validation?.amount ?? payload.amount),
      nextStatus,
    });
  }

  /** Handle ShurjoPay IPN callback with verification. */
  async handleShurjoPayWebhook(payload: Record<string, string>) {
    const orderId = this.readValue(payload, [
      "order_id",
      "sp_order_id",
      "invoice",
      "orderId",
    ]);
    if (!orderId) {
      return;
    }
    const verification = await this.verifyShurjoPay(orderId);
    if (!verification) {
      return;
    }
    const record = Array.isArray(verification) ? verification[0] : verification;
    if (!record) {
      return;
    }
    const transactionId = record.order_id ?? orderId;
    const merchantOrderId = record.customer_order_id ?? record.customerOrderId;
    const nextStatus = this.resolveShurjoPayStatus(record.sp_code ?? record.spCode);
    await this.upsertPaymentStatus({
      provider: "SHURJOPAY",
      transactionId,
      orderId: merchantOrderId,
      amount: this.parseAmount(record.amount ?? record.payable_amount),
      nextStatus,
    });
  }

  /** Initiate SSLCommerz payment. */
  private async initiateSslCommerz(orderId: string, amount: number) {
    const initUrl = process.env.SSLCOMMERZ_INIT_URL;
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePass = process.env.SSLCOMMERZ_STORE_PASS;
    if (!initUrl || !storeId || !storePass) {
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          provider: "SSLCOMMERZ",
          status: "pending",
          amount,
        },
      });
      return {
        payment_id: payment.id,
        provider: "SSLCOMMERZ",
        status: "pending",
        redirect_url: null,
      };
    }
    const response = await axios.post(
      initUrl,
      {
        store_id: storeId,
        store_passwd: storePass,
        total_amount: amount,
        currency: "BDT",
        tran_id: orderId,
        success_url: process.env.SSLCOMMERZ_SUCCESS_URL,
        fail_url: process.env.SSLCOMMERZ_FAIL_URL,
        cancel_url: process.env.SSLCOMMERZ_CANCEL_URL,
        ipn_url: process.env.SSLCOMMERZ_IPN_URL,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        provider: "SSLCOMMERZ",
        status: "initiated",
        transactionId: orderId,
        amount,
      },
    });
    return {
      payment_id: payment.id,
      provider: "SSLCOMMERZ",
      status: "initiated",
      redirect_url: response.data?.GatewayPageURL ?? null,
    };
  }

  /** Initiate ShurjoPay payment. */
  private async initiateShurjoPay(orderId: string, amount: number) {
    const tokenUrl = process.env.SHURJOPAY_TOKEN_URL;
    const paymentUrl =
      process.env.SHURJOPAY_PAYMENT_URL ?? this.deriveShurjoPayUrl(tokenUrl, "secret-pay");
    const username = process.env.SHURJOPAY_USERNAME;
    const password = process.env.SHURJOPAY_PASSWORD;
    const prefix = process.env.SHURJOPAY_PREFIX ?? "QAIDI";
    if (!tokenUrl || !paymentUrl || !username || !password) {
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          provider: "SHURJOPAY",
          status: "pending",
          amount,
        },
      });
      return {
        payment_id: payment.id,
        provider: "SHURJOPAY",
        status: "pending",
        redirect_url: null,
      };
    }
    const tokenPayload = await this.getShurjoPayToken();
    if (!tokenPayload) {
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          provider: "SHURJOPAY",
          status: "pending",
          amount,
        },
      });
      return {
        payment_id: payment.id,
        provider: "SHURJOPAY",
        status: "pending",
        redirect_url: null,
      };
    }
    const response = await axios.post(
      paymentUrl,
      {
        prefix,
        token: tokenPayload.token,
        store_id: tokenPayload.storeId,
        amount,
        order_id: orderId,
        currency: "BDT",
        return_url: process.env.SHURJOPAY_RETURN_URL,
        cancel_url: process.env.SHURJOPAY_CANCEL_URL,
        customer_name: "QAIDILife Customer",
        customer_address: "Dhaka",
        customer_email: "guest@qaidilife.com",
        customer_phone: "01700000000",
        customer_city: "Dhaka",
        value1: orderId,
      },
      {
        headers: {
          Authorization: `${tokenPayload.tokenType ?? "Bearer"} ${tokenPayload.token}`,
        },
      },
    );
    const transactionId = response.data?.sp_order_id ?? response.data?.order_id ?? orderId;
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        provider: "SHURJOPAY",
        status: "initiated",
        transactionId,
        amount,
      },
    });
    return {
      payment_id: payment.id,
      provider: "SHURJOPAY",
      status: "initiated",
      redirect_url: response.data?.checkout_url ?? null,
    };
  }

  /** Verify SSLCommerz transaction with validation API. */
  private async validateSslCommerz(valId: string) {
    const validationUrl = this.resolveSslCommerzValidationUrl();
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePass = process.env.SSLCOMMERZ_STORE_PASS;
    if (!validationUrl || !storeId || !storePass) {
      return null;
    }
    try {
      const response = await axios.get(validationUrl, {
        params: {
          val_id: valId,
          store_id: storeId,
          store_passwd: storePass,
          v: 1,
          format: "json",
        },
      });
      return response.data as { status?: string; amount?: string };
    } catch (error) {
      this.logger.warn("SSLCommerz validation failed");
      return null;
    }
  }

  /** Verify ShurjoPay transaction by order id. */
  private async verifyShurjoPay(
    orderId: string,
  ): Promise<ShurjoPayVerificationRecord | ShurjoPayVerificationRecord[] | null> {
    const tokenUrl = process.env.SHURJOPAY_TOKEN_URL;
    const verifyUrl =
      process.env.SHURJOPAY_VERIFY_URL ?? this.deriveShurjoPayUrl(tokenUrl, "verification");
    if (!verifyUrl) {
      return null;
    }
    const tokenPayload = await this.getShurjoPayToken();
    if (!tokenPayload) {
      return null;
    }
    try {
      const response = await axios.post(
        verifyUrl,
        { order_id: orderId },
        {
          headers: {
            Authorization: `${tokenPayload.tokenType ?? "Bearer"} ${tokenPayload.token}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data as ShurjoPayVerificationRecord | ShurjoPayVerificationRecord[];
    } catch (error) {
      this.logger.warn("ShurjoPay verification failed");
      return null;
    }
  }

  /** Resolve SSLCommerz status into internal status values. */
  private resolveSslCommerzStatus(status?: string): PaymentStatus {
    const normalized = status?.toUpperCase() ?? "";
    if (normalized.startsWith("VALID")) {
      return "paid";
    }
    if (normalized === "CANCELLED") {
      return "cancelled";
    }
    if (normalized === "FAILED" || normalized === "EXPIRED" || normalized === "UNATTEMPTED") {
      return "failed";
    }
    return "pending";
  }

  /** Resolve ShurjoPay status codes into internal status values. */
  private resolveShurjoPayStatus(spCode?: string | number): PaymentStatus {
    const code = Number(spCode);
    if (code === 1000) {
      return "paid";
    }
    if (code === 1002) {
      return "cancelled";
    }
    if (code === 1001) {
      return "failed";
    }
    return "pending";
  }

  /** Update or create a payment and apply idempotent transitions. */
  private async upsertPaymentStatus(input: {
    provider: PaymentProvider;
    transactionId: string;
    orderId?: string | null;
    amount?: number | null;
    nextStatus: PaymentStatus;
  }) {
    let payment = await this.prisma.payment.findFirst({
      where: {
        provider: input.provider,
        transactionId: input.transactionId,
      },
    });
    if (!payment && input.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: input.orderId },
      });
      if (!order) {
        return;
      }
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          provider: input.provider,
          status: "pending",
          amount: input.amount ?? order.total,
          transactionId: input.transactionId,
        },
      });
    }
    if (!payment) {
      return;
    }
    const currentStatus = normalizePaymentStatus(payment.status);
    const nextStatus = applyPaymentTransition(currentStatus, input.nextStatus);
    if (nextStatus === currentStatus) {
      return;
    }
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: nextStatus },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: nextStatus === "paid" ? "paid" : nextStatus,
        },
      }),
    ]);
  }

  /** Fetch ShurjoPay auth token payload. */
  private async getShurjoPayToken() {
    const tokenUrl = process.env.SHURJOPAY_TOKEN_URL;
    const username = process.env.SHURJOPAY_USERNAME;
    const password = process.env.SHURJOPAY_PASSWORD;
    if (!tokenUrl || !username || !password) {
      return null;
    }
    const response = await axios.post(
      tokenUrl,
      { username, password },
      { headers: { "Content-Type": "application/json" } },
    );
    if (!response.data?.token) {
      return null;
    }
    return {
      token: response.data.token as string,
      tokenType: response.data.token_type as string | undefined,
      storeId: response.data.store_id as number | undefined,
    };
  }

  /** Resolve SSLCommerz validation URL with sandbox fallback. */
  private resolveSslCommerzValidationUrl() {
    if (process.env.SSLCOMMERZ_VALIDATION_URL) {
      return process.env.SSLCOMMERZ_VALIDATION_URL;
    }
    const initUrl = process.env.SSLCOMMERZ_INIT_URL;
    if (initUrl?.includes("sandbox")) {
      return "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";
    }
    if (initUrl?.includes("securepay")) {
      return "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";
    }
    return null;
  }

  /** Derive ShurjoPay endpoint from token URL when available. */
  private deriveShurjoPayUrl(tokenUrl: string | undefined, endpoint: string) {
    if (!tokenUrl) {
      return undefined;
    }
    if (tokenUrl.match(/\/get_token\/?$/)) {
      return tokenUrl.replace(/\/get_token\/?$/, `/${endpoint}`);
    }
    return undefined;
  }

  /** Safely read scalar values from payloads. */
  private readValue(payload: Record<string, string>, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }
    return undefined;
  }

  /** Parse amount values from gateway payloads. */
  private parseAmount(value?: string | number | null) {
    if (value === null || value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
