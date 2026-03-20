import NodeCache from "node-cache";
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
      useClones: true,
      maxKeys: MAX_KEYS,
    });

    console.log(
      `CacheService initialized (maxKeys=${MAX_KEYS}, useClones=true)`
    );
  }

  /**
   * Get a value from cache.
   */
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

  /**
   * Set a value in cache. Silently fails on overflow or errors.
   */
  set<T>(key: string, value: T, ttl: number): boolean {
    try {
      return this.cache.set(key, value, ttl);
    } catch (err) {
      log("error", "set.set failed", { err: err instanceof Error ? err.message : String(err) });
      console.warn(`CacheService.set failed for key "${key}":`, err);
      return false;
    }
  }

  /**
   * Cache-aside with stampede protection.
   * If multiple callers request the same key concurrently, only one fetcher runs.
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    // Try cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Stampede protection: coalesce concurrent requests for the same key
    const pending = this.pendingFetches.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

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

  /**
   * Delete a single key.
   */
  del(key: string): void {
    try {
      this.cache.del(key);
    } catch {
      // ignore
    }
  }

  /**
   * Delete all keys matching a prefix.
   */
  delByPrefix(prefix: string): void {
    try {
      const keys = this.cache.keys();
      const toDelete = keys.filter((k) => k.startsWith(prefix));
      if (toDelete.length > 0) {
        this.cache.del(toDelete);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Flush all cache entries.
   */
  flush(): void {
    try {
      this.cache.flushAll();
      console.log("CacheService flushed all entries");
    } catch {
      // ignore
    }
  }

  /**
   * Return hit/miss statistics.
   */
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
