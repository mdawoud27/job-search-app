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

const router = Router();

const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

router.get('/api/version', (req, res) => res.json({ version }));

router.use(
  '/api/auth',
  rateLimiter({
    maxRequests: 5,
    windowSeconds: 60,
    message: 'Too many auth attempts, try again later',
  }),
  authRouter,
);

const v1Limiter = rateLimiter({ maxRequests: 100, windowSeconds: 60 });

router.use('/api/v1', v1Limiter, userRouter);
router.use('/api/v1', v1Limiter, adminRouter);
router.use('/api/v1', v1Limiter, companyRouter);
router.use('/api/v1', v1Limiter, jobRouter);
router.use('/api/v1', v1Limiter, applicationRouter);
router.use('/api/v1', v1Limiter, chatRouter);

router.use(
  '/graphql',
  rateLimiter({
    maxRequests: 20,
    windowSeconds: 60,
    message: 'Too many GraphQL requests, try again later',
  }),
  graphqlRouter,
);

export default router;
