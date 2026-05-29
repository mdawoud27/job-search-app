import redis from '../config/redis.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

export const rateLimiter = ({
  maxRequests = 10,
  windowSeconds = 60,
  message = 'Too many requests. Try again later.',
} = {}) => {
  return async (req, res, next) => {
    try {
      const identifier =
        req.user?.id?.toString() || req.user?._id?.toString() || req.ip;

      const hashedId = crypto
        .createHash('sha256')
        .update(identifier)
        .digest('hex');
      const routeKey = req.baseUrl || req.path;
      const type = req.user ? 'user' : 'ip';
      const key = `rateLimit:${routeKey}:${type}:${hashedId}`;

      const now = Date.now();
      const windowStart = now - windowSeconds * 1000;

      const pipeline = redis.multi();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.zcard(key);
      pipeline.expire(key, windowSeconds);
      const results = await pipeline.exec();

      const requestsCount = results[2];

      const remainingRequests = Math.max(maxRequests - requestsCount, 0);
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': remainingRequests,
        'X-RateLimit-Reset': windowSeconds,
      });

      if (requestsCount > maxRequests) {
        res.set('Retry-After', windowSeconds);
        return res.status(429).json({
          success: false,
          message,
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: windowSeconds,
          remainingRequests: 0,
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      next(error);
    }
  };
};
