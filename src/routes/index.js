import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import adminRouter from './admin.routes.js';
import companyRouter from './company.routes.js';
import jobRouter from './job.routes.js';
import applicationRouter from './application.routes.js';
import chatRouter from './chat.routes.js';

const router = Router();

import { readFileSync } from 'fs';
import { apiLimiter } from '../utils/apiLimiter.js';
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url)),
);

/**
 * @route GET /api/version
 * @desc Get API version
 * @access Public
 */
router.get('/api/version', (req, res) => {
  res.json({ version: packageJson.version });
});

router.use('/api', apiLimiter, authRouter);
router.use('/api/v1', apiLimiter, userRouter);
router.use('/api/v1', apiLimiter, adminRouter);
router.use('/api/v1', apiLimiter, companyRouter);
router.use('/api/v1', apiLimiter, jobRouter);
router.use('/api/v1', apiLimiter, applicationRouter);
router.use('/api/v1', apiLimiter, chatRouter);

export default router;
