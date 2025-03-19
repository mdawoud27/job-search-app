import { Router } from 'express';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import companyRouter from './routes/company.routes.js';
import jobRouter from './routes/job.routes.js';
import applicationRouter from './routes/application.routes.js';

const router = Router();

router.use(authRouter);
router.use(userRouter);
router.use(adminRouter);
router.use(companyRouter);
router.use(jobRouter);
router.use(applicationRouter);

export default router;
