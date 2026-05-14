import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

/** Orders module for user history. */
@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
