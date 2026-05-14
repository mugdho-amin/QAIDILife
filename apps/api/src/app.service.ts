import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { CacheService } from "./common/cache.service";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getHealth() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = "healthy";
    } catch {
      checks.database = "unhealthy";
    }

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        await this.cache.get("health:ping");
        checks.redis = "healthy";
      } catch {
        checks.redis = "unhealthy";
      }
    } else {
      checks.redis = "not_configured";
    }

    const allHealthy = Object.values(checks).every((s) => s === "healthy" || s === "not_configured");

    return {
      status: allHealthy ? "ok" : "degraded",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };
  }
}
