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
import { rateLimiter } from '../middlewares/rateLimit.middleware.js';
import { Authorization } from '../middlewares/auth.middleware.js';

const router = Router();

const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

router.get('/api/version', (req, res) => res.json({ version }));

const authLimiter = rateLimiter({
  maxRequests: 5,
  windowSeconds: 60,
  message: 'Too many auth attempts, try again later',
});

const v1Limiter = rateLimiter({
  maxRequests: 100,
  windowSeconds: 60,
});

const graphqlLimiter = rateLimiter({
  maxRequests: 20,
  windowSeconds: 60,
  message: 'Too many GraphQL requests, try again later',
});

router.use('/api', authLimiter, authRouter);

router.use('/api/v1', Authorization.verifyToken, v1Limiter);
router.use('/api/v1', userRouter);
router.use('/api/v1', adminRouter);
router.use('/api/v1', companyRouter);
router.use('/api/v1', jobRouter);
router.use('/api/v1', applicationRouter);
router.use('/api/v1', chatRouter);

router.use(
  '/graphql',
  Authorization.verifyToken,
  graphqlLimiter,
  graphqlRouter,
);

export default router;
