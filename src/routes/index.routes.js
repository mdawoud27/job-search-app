import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import adminRouter from './admin.routes.js';
import companyRouter from './company.routes.js';
import jobRouter from './job.routes.js';
import applicationRouter from './application.routes.js';

const router = Router();

router.use(authRouter);
router.use(userRouter);
router.use(adminRouter);
router.use(companyRouter);
router.use(jobRouter);
router.use(applicationRouter);

export default router;
