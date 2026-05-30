import redis from '../config/redis.js';

export const cacheMiddleware =
  (ttl = 300) =>
  async (req, res, next) => {
    const key = `route:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);

      res.json = (data) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(key, ttl, JSON.stringify(data)).catch(() => {});
        }
        return originalJson(data);
      };

      next();
    } catch {
      // just continue if redis fails
      next();
    }
  };
