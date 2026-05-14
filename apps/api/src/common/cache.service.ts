import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";

/** Cache service backed by Redis with in-memory fallback. */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, string>();
  private redis: Redis | null;
  private hasLoggedRedisError = false;

  /** Initialize Redis client if configured. */
  constructor() {
    const url = process.env.REDIS_URL;
    if (url) {
      this.redis = new Redis(url, { maxRetriesPerRequest: 2 });
      this.redis.on("error", this.handleRedisError.bind(this));
    } else {
      this.redis = null;
    }
  }

  /** Handle Redis error events. */
  private handleRedisError(error: Error) {
    if (!this.hasLoggedRedisError) {
      this.logger.warn(`Redis error: ${error.message}`);
      this.hasLoggedRedisError = true;
    }
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }
  }

  /** Get a cached value by key. */
  async get(key: string): Promise<string | null> {
    if (this.redis) {
      return this.redis.get(key);
    }
    return this.memory.get(key) ?? null;
  }

  /** Set a cached value by key with optional TTL in seconds. */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.redis) {
      if (ttlSeconds) {
        await this.redis.set(key, value, "EX", ttlSeconds);
        return;
      }
      await this.redis.set(key, value);
      return;
    }
    this.memory.set(key, value);
  }

  /** Delete a cached value by key. */
  async del(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    this.memory.delete(key);
  }
}
