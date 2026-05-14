import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/** Admin payment service for reviewing payment sessions. */
@Injectable()
export class AdminPaymentsService {
  /** Create admin payments service. */
  constructor(private readonly prisma: PrismaService) {}

  /** List payments. */
  async listPayments() {
    const payments = await this.prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
    });
    return payments.map((payment) => this.mapPayment(payment));
  }

  /** Get payment by id. */
  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    return this.mapPayment(payment);
  }

  /** Map payment to admin response. */
  private mapPayment(payment: {
    id: string;
    provider: string;
    status: string;
    amount: number;
    transactionId: string | null;
    createdAt: Date;
    orderId: string;
  }) {
    return {
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt.toISOString(),
      orderId: payment.orderId,
    };
  }
}
