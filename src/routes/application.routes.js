import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth';
import { getJobApplications } from '../controllers/application.controller';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission';

const router = Router();

router.get(
  '/api/jobs/:jobId/applications',
  verifyAccessToken,
  verifyAdminPermission,
  getJobApplications,
);

export default router;
