import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { OrdersService } from "./orders.service";

/** Orders endpoints for authenticated users. */
@Controller()
export class OrdersController {
  /** Create orders controller. */
  constructor(private readonly ordersService: OrdersService) {}

  /** List orders for current user. */
  @Get("orders")
  @UseGuards(JwtAuthGuard)
  async listOrders(@Req() req: { user?: { sub?: string } }) {
    return this.ordersService.listOrders(req.user?.sub);
  }

  /** Get a single order. */
  @Get("orders/:id")
  @UseGuards(JwtAuthGuard)
  async getOrder(
    @Param("id") id: string,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.ordersService.getOrder(req.user?.sub, id);
  }
}
