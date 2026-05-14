import { Global, Module } from "@nestjs/common";
import { CacheService } from "./cache.service";

/** Shared common services. */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CommonModule {}
