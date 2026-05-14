import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { AdminMetricsService } from "./admin-metrics.service";

/** Admin metrics endpoints. */
@Controller("admin/metrics")
@UseGuards(AdminGuard)
export class AdminMetricsController {
  /** Create metrics controller. */
  constructor(private readonly metricsService: AdminMetricsService) {}

  /** Return dashboard metrics. */
  @Get()
  async getMetrics() {
    return this.metricsService.getMetrics();
  }
}
