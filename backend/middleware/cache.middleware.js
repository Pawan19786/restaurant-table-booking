// ── In-Memory API Response Cache ─────────────────────────────────
// Lightweight Map-based cache with TTL. No external dependency needed.
// Cache key = request originalUrl so each endpoint is cached independently.
// Usage:
//   import { cacheResponse, invalidateCache } from "../middleware/cache.middleware.js";
//   router.get("/", cacheResponse(30), controller);          // cache 30s
//   invalidateCache("/api/restaurants");                       // bust on CUD

const cache = new Map(); // key → { data, expiry }

/**
 * Express middleware – serves cached JSON if available, otherwise
 * monkey-patches res.json to capture and store the response.
 * @param {number} ttlSeconds  Time-to-live in seconds (default 30)
 */
export const cacheResponse = (ttlSeconds = 30) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") return next();

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && cached.expiry > Date.now()) {
      // Cache HIT — return stored data
      return res.status(200).json(cached.data);
    }

    // Cache MISS — intercept res.json to capture the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data: body,
          expiry: Date.now() + ttlSeconds * 1000,
        });
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate all cache entries whose key starts with the given pattern.
 * Call this in create / update / delete controllers.
 * @param {string} pattern  URL prefix, e.g. "/api/restaurants"
 */
export const invalidateCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
};

/**
 * Clear entire cache (useful for admin operations)
 */
export const clearAllCache = () => {
  cache.clear();
};

// Periodic cleanup of expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiry <= now) cache.delete(key);
  }
}, 5 * 60 * 1000).unref();
