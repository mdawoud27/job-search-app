import { Router } from 'express';
import { readFileSync } from 'fs';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import adminRouter from './admin.routes.js';
import companyRouter from './company.routes.js';
import jobRouter from './job.routes.js';
import applicationRouter from './application.routes.js';
import chatRouter from './chat.routes.js';
import graphqlRouter from './graphql.routes.js';
import { rateLimiterMiddleware } from '../middlewares/rateLimit.middleware.js';
import { Authorization } from '../middlewares/auth.middleware.js';

const router = Router();

const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

router.get('/api/version', (req, res) => res.json({ version }));

const v1Limiter = rateLimiterMiddleware({
  maxRequests: 100,
  windowSeconds: 60,
});

const graphqlLimiter = rateLimiterMiddleware({
  maxRequests: 20,
  windowSeconds: 60,
  message: 'Too many GraphQL requests, try again later',
});

router.use('/api', authRouter);

router.use('/api/v1', v1Limiter, Authorization.verifyToken, userRouter);
router.use('/api/v1', v1Limiter, Authorization.verifyToken, adminRouter);
router.use('/api/v1', v1Limiter, Authorization.verifyToken, companyRouter);
router.use('/api/v1', v1Limiter, Authorization.verifyToken, jobRouter);
router.use('/api/v1', v1Limiter, Authorization.verifyToken, applicationRouter);
router.use('/api/v1', v1Limiter, Authorization.verifyToken, chatRouter);

router.use(
  '/graphql',
  graphqlLimiter,
  Authorization.verifyToken,
  graphqlRouter,
);

export default router;
