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
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url)),
);

router.get('/api/version', (req, res) => {
  res.json({ version: packageJson.version });
});

router.use('/api', authRouter);
router.use('/api/v1', userRouter);
router.use('/api/v1', adminRouter);
router.use('/api/v1', companyRouter);
router.use('/api/v1', jobRouter);
router.use('/api/v1', applicationRouter);
router.use('/api/v1', chatRouter);

export default router;
