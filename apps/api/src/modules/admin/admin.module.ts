import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { AdminCatalogController } from "./admin-catalog.controller";
import { AdminCatalogService } from "./admin-catalog.service";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminOrdersService } from "./admin-orders.service";
import { AdminPaymentsController } from "./admin-payments.controller";
import { AdminPaymentsService } from "./admin-payments.service";
import { AdminMetricsController } from "./admin-metrics.controller";
import { AdminMetricsService } from "./admin-metrics.service";

/** Admin module for back-office management. */
@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AdminAuthController,
    AdminCatalogController,
    AdminOrdersController,
    AdminPaymentsController,
    AdminMetricsController,
  ],
  providers: [
    AdminAuthService,
    AdminCatalogService,
    AdminOrdersService,
    AdminPaymentsService,
    AdminMetricsService,
  ],
})
export class AdminModule {}
