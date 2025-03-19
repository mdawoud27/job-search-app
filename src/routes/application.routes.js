import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth.js';
import {
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
} from '../controllers/application.controller.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';
import { verifyUserPermission } from '../middlewares/verifyUserPermission.js';
import { apiLimiter } from '../utils/apiLimiter.js';

const router = Router();

// get Job Applications
router.get(
  '/api/jobs/:jobId/applications',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  getJobApplications,
);

// Apply to job
router.get(
  '/api/jobs/:jobId/apply',
  verifyAccessToken,
  verifyUserPermission,
  apiLimiter,
  applyToJob,
);

// Update application status
router.patch(
  '/api/applications/:applicationId/status',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  updateApplicationStatus,
);

export default router;
