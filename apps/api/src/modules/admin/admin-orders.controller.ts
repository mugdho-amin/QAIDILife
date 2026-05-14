import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AdminGuard } from "./admin.guard";
import { AdminOrdersService } from "./admin-orders.service";

const statusSchema = z.object({
  status: z.string().min(1),
});

/** Admin orders endpoints. */
@Controller("admin/orders")
@UseGuards(AdminGuard)
export class AdminOrdersController {
  /** Create admin orders controller. */
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  /** List orders. */
  @Get()
  async listOrders() {
    return this.adminOrdersService.listOrders();
  }

  /** Get order by id. */
  @Get(":id")
  async getOrder(@Param("id") id: string) {
    return this.adminOrdersService.getOrder(id);
  }

  /** Update order status. */
  @Patch(":id")
  async updateOrder(@Param("id") id: string, @Body() body: unknown) {
    const parsed = statusSchema.parse(body);
    return this.adminOrdersService.updateOrderStatus(id, parsed.status);
  }
}
