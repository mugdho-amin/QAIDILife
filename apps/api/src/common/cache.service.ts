import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, { value: string; expiry: number }>();
  private redis: Redis | null;
  private hasLoggedRedisError = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (url) {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => Math.min(times * 100, 2000),
        lazyConnect: true,
      });
      this.redis.on("error", this.handleRedisError.bind(this));
    } else {
      this.redis = null;
    }
  }

  private handleRedisError(error: Error) {
    if (!this.hasLoggedRedisError) {
      this.logger.warn(`Redis error: ${error.message}. Falling back to in-memory cache.`);
      this.hasLoggedRedisError = true;
    }
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }
  }

  async get<T = string>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const val = await this.redis.get(key);
        if (val === null) return null;
        try {
          return JSON.parse(val) as T;
        } catch {
          return val as unknown as T;
        }
      } catch {
        return this.getFromMemory<T>(key);
      }
    }
    return this.getFromMemory<T>(key);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    if (this.redis) {
      try {
        if (ttlSeconds) {
          await this.redis.set(key, str, "EX", ttlSeconds);
        } else {
          await this.redis.set(key, str);
        }
        return;
      } catch {
        this.setInMemory(key, str, ttlSeconds);
        return;
      }
    }
    this.setInMemory(key, str, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch {
        this.memory.delete(key);
        return;
      }
    }
    this.memory.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return;
      } catch {
        for (const k of this.memory.keys()) {
          if (k.includes(pattern.replace("*", ""))) {
            this.memory.delete(k);
          }
        }
        return;
      }
    }
    for (const k of this.memory.keys()) {
      if (k.includes(pattern.replace("*", ""))) {
        this.memory.delete(k);
      }
    }
  }

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiry > 0 && Date.now() > entry.expiry) {
      this.memory.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return entry.value as unknown as T;
    }
  }

  private setInMemory(key: string, value: string, ttlSeconds?: number) {
    this.memory.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0,
    });
  }
}
