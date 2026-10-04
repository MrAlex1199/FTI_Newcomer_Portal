/**
 * In-Memory TTL Cache Service
 * High-performance, lightweight in-memory cache with TTL support and prefix invalidation.
 * Eliminates round-trips to MongoDB Atlas for frequently requested master data.
 */

class CacheService {
  constructor() {
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletions: 0,
    };

    // Auto-cleanup expired entries every 5 minutes to prevent memory leak
    this.cleanupInterval = setInterval(() => {
      this.purgeExpired();
    }, 5 * 60 * 1000);

    // Ensure the cleanup interval doesn't hold the Node process open during tests
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Set a key with TTL in seconds (default: 300 seconds = 5 minutes)
   */
  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    this.stats.sets++;
    return value;
  }

  /**
   * Get a cached value. Returns null if expired or missing.
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Cache-aside helper: Retrieve if present, otherwise fetch and cache.
   */
  async remember(key, ttlSeconds, fetcherFn) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcherFn();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  /**
   * Delete a specific key
   */
  del(key) {
    const deleted = this.store.delete(key);
    if (deleted) this.stats.deletions++;
    return deleted;
  }

  /**
   * Invalidate all keys starting with a prefix (e.g. 'departments', 'company_info')
   */
  delByPrefix(prefix) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    this.stats.deletions += count;
    return count;
  }

  /**
   * Purge all expired items
   */
  purgeExpired() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  flush() {
    this.store.clear();
  }

  /**
   * Observability metrics
   */
  getStats() {
    return {
      size: this.store.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRatio:
        this.stats.hits + this.stats.misses > 0
          ? Number(((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2))
          : 0,
      sets: this.stats.sets,
      deletions: this.stats.deletions,
      keys: Array.from(this.store.keys()),
    };
  }
}

const cacheService = new CacheService();
export default cacheService;
