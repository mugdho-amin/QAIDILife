import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminGuard } from './admin.guard';
import { AdminMetricsController } from './admin-metrics.controller';
import { AdminMetricsService } from './admin-metrics.service';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';

/** Admin module for back-office management. */
@Module({
  imports: [],
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
    AdminGuard,
  ],
})
export class AdminModule {}
