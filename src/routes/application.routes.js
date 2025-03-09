import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth.js';
import { getJobApplications } from '../controllers/application.controller.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';
import { verifyUserPermission } from '../middlewares/verifyUserPermission.js';

const router = Router();

router.get(
  '/api/jobs/:jobId/applications',
  verifyAccessToken,
  verifyAdminPermission,
  getJobApplications,
);

router.get(
  '/api/jobs/:jobId/apply',
  verifyAccessToken,
  verifyUserPermission,
  getJobApplications,
);

export default router;
