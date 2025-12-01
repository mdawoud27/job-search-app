import { Router } from 'express';
import { jobController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
  '/job/create/:companyId',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => jobController.createJob(req, res, next),
);

export default router;
