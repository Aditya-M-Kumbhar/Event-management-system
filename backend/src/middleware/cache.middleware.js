/**
 * Response Cache Middleware
 * Uses node-cache for simple in-memory caching of GET responses
 */
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 120, checkperiod: 60 });

const cacheMiddleware = (ttlSeconds = 120) => (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `__cache__${req.originalUrl}`;
  const cached = cache.get(key);

  if (cached) {
    return res.status(200).json(cached);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200) cache.set(key, body, ttlSeconds);
    return originalJson(body);
  };

  next();
};

const clearCache = (pattern) => {
  const keys = cache.keys();
  keys.forEach(k => { if (!pattern || k.includes(pattern)) cache.del(k); });
};

module.exports = { cacheMiddleware, clearCache };
