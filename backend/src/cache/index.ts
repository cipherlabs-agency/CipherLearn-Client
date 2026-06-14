import NodeCache from "node-cache";
import logger from "../utils/logger";
import { log } from "../utils/logtail";

const MAX_KEYS = 5000;

class CacheService {
  private cache: NodeCache;
  private pendingFetches: Map<string, Promise<unknown>> = new Map();
  private hits = 0;
  private misses = 0;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
      useClones: false, // ⚠ callers MUST NOT mutate returned objects — skips deep-clone for perf
      maxKeys: MAX_KEYS,
    });

    logger.info(`[Cache] Initialized (maxKeys=${MAX_KEYS}, useClones=false)`);
  }

  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key);
      if (value !== undefined) {
        this.hits++;
        return value;
      }
      this.misses++;
      return undefined;
    } catch {
      return undefined;
    }
  }

  set<T>(key: string, value: T, ttl: number): boolean {
    try {
      return this.cache.set(key, value, ttl);
    } catch (err) {
      log("error", "cache.set failed", { err: err instanceof Error ? err.message : String(err) });
      logger.warn(`[Cache] set failed for key "${key}":`, err);
      return false;
    }
  }

  /**
   * Cache-aside with stampede protection.
   * Concurrent requests for the same uncached key share a single fetcher promise.
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const pending = this.pendingFetches.get(key);
    if (pending) return pending as Promise<T>;

    const fetchPromise = fetcher()
      .then((result) => {
        this.set(key, result, ttl);
        return result;
      })
      .finally(() => {
        this.pendingFetches.delete(key);
      });

    this.pendingFetches.set(key, fetchPromise);
    return fetchPromise;
  }

  del(key: string): void {
    try {
      this.cache.del(key);
    } catch {
      // ignore
    }
  }

  delByPrefix(prefix: string): void {
    try {
      const keys = this.cache.keys();
      const toDelete = keys.filter((k) => k.startsWith(prefix));
      if (toDelete.length > 0) this.cache.del(toDelete);
    } catch {
      // ignore
    }
  }

  flush(): void {
    try {
      this.cache.flushAll();
      logger.info("[Cache] Flushed all entries");
    } catch {
      // ignore
    }
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      keys: this.cache.keys().length,
      hitRate:
        this.hits + this.misses > 0
          ? Math.round((this.hits / (this.hits + this.misses)) * 100)
          : 0,
    };
  }
}

export const cacheService = new CacheService();
