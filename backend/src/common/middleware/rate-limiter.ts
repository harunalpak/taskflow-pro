import rateLimit from 'express-rate-limit';
import redis from '../../infra/redis/redis-client';
import logger from '../../common/logger';

// Custom Redis store for express-rate-limit
class RedisStore {
  prefix: string;
  private useMemoryFallback: boolean = false;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(options: { prefix: string }) {
    this.prefix = options.prefix;
  }

  async increment(key: string): Promise<{ totalHits: number; timeToExpire: number | null }> {
    const redisKey = `${this.prefix}${key}`;
    
    try {
      const current = await redis.incr(redisKey);
      
      if (current === 1) {
        // Set expiration on first hit
        await redis.expire(redisKey, 900); // 15 minutes
      }
      
      const ttl = await redis.ttl(redisKey);
      this.useMemoryFallback = false; // Redis is working
      return {
        totalHits: current,
        timeToExpire: ttl > 0 ? ttl * 1000 : null,
      };
    } catch (error) {
      // Fallback to memory store if Redis fails
      if (!this.useMemoryFallback) {
        logger.warn('Redis store failed, falling back to memory store');
        this.useMemoryFallback = true;
      }
      
      const memoryKey = redisKey;
      const now = Date.now();
      const stored = this.memoryStore.get(memoryKey);
      
      if (!stored || now > stored.resetTime) {
        this.memoryStore.set(memoryKey, {
          count: 1,
          resetTime: now + 15 * 60 * 1000, // 15 minutes
        });
        return {
          totalHits: 1,
          timeToExpire: 15 * 60 * 1000,
        };
      }
      
      stored.count++;
      return {
        totalHits: stored.count,
        timeToExpire: stored.resetTime - now,
      };
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    try {
      await redis.decr(redisKey);
    } catch (error) {
      // Memory fallback
      const memoryKey = redisKey;
      const stored = this.memoryStore.get(memoryKey);
      if (stored && stored.count > 0) {
        stored.count--;
      }
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    try {
      await redis.del(redisKey);
    } catch (error) {
      // Memory fallback
      this.memoryStore.delete(redisKey);
    }
  }
}

// Development: More lenient limits, Production: Stricter limits
const isDevelopment = process.env.NODE_ENV === 'development';

export const globalRateLimiter = rateLimit({
  store: new RedisStore({
    prefix: 'rl:global:',
  }) as any,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Development: 1000 requests, Production: 100 requests
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  },
});

export const authRateLimiter = rateLimit({
  store: new RedisStore({
    prefix: 'rl:auth:',
  }) as any,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // Development: 50 requests, Production: 5 requests
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
