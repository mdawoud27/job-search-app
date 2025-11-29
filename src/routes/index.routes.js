import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import adminRouter from './admin.routes.js';
import companyRouter from './company.routes.js';
import jobRouter from './job.routes.js';
import applicationRouter from './application.routes.js';

const router = Router();

router.use('/api/v1', authRouter);
router.use('/api/v1', userRouter);
router.use('/api/v1', adminRouter);
router.use('/api/v1', companyRouter);
router.use('/api/v1', jobRouter);
router.use('/api/v1', applicationRouter);

export default router;
