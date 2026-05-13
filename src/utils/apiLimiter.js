import rateLimit from 'express-rate-limit';
import { MSG } from './messages';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: MSG.RATE_LIMIT.TOO_MANY_REQUESTS,
  },
});
