import redis from '../config/redis.js';

export const cahceMiddleware =
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
        redis.setex(key, ttl, JSON.stringify(data)).catch(() => {});
        return originalJson(data);
      };

      next();
    } catch (err) {
      // just continue if redis fails
      next(err);
    }
  };
