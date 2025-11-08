import { createHash } from 'crypto';
import { logger } from '../utils/logger';
import { LLMResponse } from './llm-service';

// In-memory cache implementation
class InMemoryCache {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  private cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug({ removed }, 'Cleaned up expired cache entries');
    }
  }

  close() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Cache service with Redis/in-memory fallback
class CacheService {
  private cache: any = null; // Redis client or InMemoryCache
  private useRedis: boolean = false;
  private hits: number = 0;
  private misses: number = 0;

  async initialize() {
    try {
      // Try to connect to Redis
      const connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: 1,
        connectTimeout: 2000
      };

      // Test Redis connection
      const Redis = (await import('ioredis')).default;
      const testClient = new Redis(connection);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          testClient.disconnect();
          reject(new Error('Redis connection timeout'));
        }, 2000);

        testClient.on('ready', () => {
          clearTimeout(timeout);
          testClient.disconnect();
          resolve();
        });

        testClient.on('error', (err) => {
          clearTimeout(timeout);
          testClient.disconnect();
          reject(err);
        });
      });

      // Redis is available
      this.cache = new Redis(connection);
      this.useRedis = true;
      logger.info('Cache service initialized with Redis');
    } catch (error) {
      // Redis not available, use in-memory cache
      logger.warn({ error }, 'Redis not available, using in-memory cache');
      this.cache = new InMemoryCache();
      this.useRedis = false;
      logger.info('Cache service initialized with in-memory storage');
    }
  }

  /**
   * Generate cache key from content using SHA256 hash
   */
  generateKey(prefix: string, content: string): string {
    const hash = createHash('sha256').update(content).digest('hex');
    return `${prefix}:${hash.substring(0, 16)}`;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.cache) {
      throw new Error('Cache service not initialized');
    }

    try {
      if (this.useRedis) {
        const value = await this.cache.get(key);
        if (value) {
          this.hits++;
          logger.debug({ key }, 'Cache hit');
          return JSON.parse(value);
        }
      } else {
        const value = await this.cache.get(key);
        if (value) {
          this.hits++;
          logger.debug({ key }, 'Cache hit');
          return value;
        }
      }

      this.misses++;
      logger.debug({ key }, 'Cache miss');
      return null;
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.cache) {
      throw new Error('Cache service not initialized');
    }

    try {
      if (this.useRedis) {
        await this.cache.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        await this.cache.set(key, value, ttlSeconds);
      }

      logger.debug({ key, ttlSeconds }, 'Cache set');
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.cache) {
      throw new Error('Cache service not initialized');
    }

    try {
      if (this.useRedis) {
        await this.cache.del(key);
      } else {
        await this.cache.delete(key);
      }

      logger.debug({ key }, 'Cache deleted');
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.cache) {
      throw new Error('Cache service not initialized');
    }

    try {
      if (this.useRedis) {
        const keys = await this.cache.keys(pattern);
        if (keys.length > 0) {
          await this.cache.del(...keys);
        }
        logger.debug({ pattern, count: keys.length }, 'Cache pattern deleted');
      } else {
        const keys = await this.cache.keys(pattern);
        for (const key of keys) {
          await this.cache.delete(key);
        }
        logger.debug({ pattern, count: keys.length }, 'Cache pattern deleted');
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Cache pattern delete error');
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    if (!this.cache) {
      throw new Error('Cache service not initialized');
    }

    try {
      if (this.useRedis) {
        await this.cache.flushdb();
      } else {
        await this.cache.clear();
      }

      this.hits = 0;
      this.misses = 0;

      logger.info('Cache cleared');
    } catch (error) {
      logger.error({ error }, 'Cache clear error');
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.hits + this.misses > 0
      ? (this.hits / (this.hits + this.misses) * 100).toFixed(2)
      : '0.00';

    return {
      type: this.useRedis ? 'Redis' : 'In-Memory',
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      ...(this.useRedis ? {} : this.cache?.getStats())
    };
  }

  /**
   * Cache LLM response
   */
  async cacheLLMResponse(
    systemPrompt: string,
    userPrompt: string,
    response: LLMResponse,
    ttlSeconds: number = 3600
  ): Promise<void> {
    const key = this.generateKey('llm', `${systemPrompt}|${userPrompt}`);
    await this.set(key, response, ttlSeconds);
  }

  /**
   * Get cached LLM response
   */
  async getCachedLLMResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<LLMResponse | null> {
    const key = this.generateKey('llm', `${systemPrompt}|${userPrompt}`);
    return await this.get<LLMResponse>(key);
  }

  async close() {
    if (this.cache) {
      if (this.useRedis) {
        await this.cache.quit();
      } else {
        this.cache.close();
      }
    }

    logger.info('Cache service closed');
  }

  isUsingRedis(): boolean {
    return this.useRedis;
  }
}

export const cacheService = new CacheService();
