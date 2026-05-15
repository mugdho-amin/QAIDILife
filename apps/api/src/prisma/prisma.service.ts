import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "../../prisma/generated-client";

/** Prisma service wrapper for NestJS lifecycle. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    const isSqlite = dbUrl?.startsWith("file:") || dbUrl?.includes(".db");
    const env = process.env.NODE_ENV || "development";

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: env === "development" ? ["query", "error", "warn"] : ["error", "warn"],
    });

    this.logger.log(
      `Initializing Prisma with ${isSqlite ? "SQLite" : "Postgres"} in ${env} mode`,
    );
  }

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
