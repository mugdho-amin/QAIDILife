import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import express from "express";
import helmet from "helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const server = express();
  server.use(express.json({ limit: "50mb" }));

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  const corsEnv = process.env.CORS_ORIGIN ?? "*";
  const origins =
    corsEnv === "*"
      ? "*"
      : corsEnv.split(",").map((o) => o.trim());
  app.enableCors({
    origin: origins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-cart-id", "x-request-id"],
    exposedHeaders: ["x-cart-id", "x-request-id"],
    credentials: true,
  });

  app.setGlobalPrefix("v1");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("QAIDILife Commerce API")
    .setDescription("Enterprise e-commerce API")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" })
    .addApiKey({ type: "apiKey", name: "x-cart-id", in: "header" }, "x-cart-id")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  await app.listen(process.env.PORT ?? 4000);
  console.log(`QAIDILife API running on port ${process.env.PORT ?? 4000}`);
  console.log(`Swagger docs at /docs`);
}

void bootstrap();
