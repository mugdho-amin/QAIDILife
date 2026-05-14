import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ZodExceptionFilter } from "./common/filters/zod-exception.filter";
import express, { json } from "express";

/** Bootstrap the QAIDILife API server. */
async function bootstrap() {
  const server = express();
  server.use(express.json({ limit: "50mb" }));

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.useGlobalFilters(new ZodExceptionFilter());
  const corsEnv = process.env.CORS_ORIGIN ?? "*";
  const origins =
    corsEnv === "*"
      ? "*"
      : corsEnv.split(",").map((origin) => origin.trim());
  app.enableCors({
    origin: origins,
  });
  app.setGlobalPrefix("v1");
  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
