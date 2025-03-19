import { Router } from 'express';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import companyRouter from './routes/company.routes.js';
import jobRouter from './routes/job.routes.js';
import applicationRouter from './routes/application.routes.js';
import { apiLimiter } from '../utils/apiLimiter.js';

const router = Router();

router.use(apiLimiter, authRouter);
router.use(userRouter);
router.use(apiLimiter, adminRouter);
router.use(apiLimiter, companyRouter);
router.use(apiLimiter, jobRouter);
router.use(apiLimiter, applicationRouter);

export default router;
