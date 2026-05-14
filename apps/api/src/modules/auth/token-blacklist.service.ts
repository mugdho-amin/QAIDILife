import { Injectable } from "@nestjs/common";
import { CacheService } from "../../common/cache.service";

@Injectable()
export class TokenBlacklistService {
  private readonly PREFIX = "blacklist:";

  constructor(private readonly cache: CacheService) {}

  async blacklist(jti: string, expiresInMs: number): Promise<void> {
    const ttl = Math.ceil(expiresInMs / 1000);
    await this.cache.set(`${this.PREFIX}${jti}`, "1", ttl);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const val = await this.cache.get(`${this.PREFIX}${jti}`);
    return val !== null;
  }
}
