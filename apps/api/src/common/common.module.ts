import { Global, Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { CacheService } from "./cache.service";
import { GlobalExceptionFilter } from "./filters/global-exception.filter";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { CorrelationIdMiddleware } from "./middleware/correlation-id.middleware";

@Global()
@Module({
  providers: [
    CacheService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
  exports: [CacheService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
