import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { AdminPaymentsService } from "./admin-payments.service";

/** Admin payments endpoints. */
@Controller("admin/payments")
@UseGuards(AdminGuard)
export class AdminPaymentsController {
  /** Create admin payments controller. */
  constructor(private readonly adminPaymentsService: AdminPaymentsService) {}

  /** List payments. */
  @Get()
  async listPayments() {
    return this.adminPaymentsService.listPayments();
  }

  /** Get payment by id. */
  @Get(":id")
  async getPayment(@Param("id") id: string) {
    return this.adminPaymentsService.getPayment(id);
  }
}
