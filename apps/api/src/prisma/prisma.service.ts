import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/** Prisma service wrapper for NestJS lifecycle. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /** Connect Prisma on module init. */
  async onModuleInit() {
    const allowFailure = process.env.PRISMA_ALLOW_INIT_FAILURE === "true";
    const skipConnect = process.env.PRISMA_SKIP_CONNECT === "true";
    if (skipConnect) {
      this.logger.warn("Skipping Prisma connect (PRISMA_SKIP_CONNECT=true).");
      return;
    }
    try {
      await this.$connect();
    } catch (error) {
      if (allowFailure) {
        this.logger.warn(
          "Prisma connect failed; continuing without DB (PRISMA_ALLOW_INIT_FAILURE=true).",
        );
        return;
      }
      throw error;
    }
  }

  /** Disconnect Prisma on module destroy. */
  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      return;
    }
  }
}
