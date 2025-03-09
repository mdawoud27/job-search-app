import { Router } from 'express';
import { addJob, updateJob } from '../controllers/job.controller.js';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';

const router = Router();

// Add job
router.post(
  '/api/company/:companyId/job',
  verifyAccessToken,
  verifyAdminPermission,
  addJob,
);

// Update Job
router.put(
  '/api/jobs/:jobId',
  verifyAccessToken,
  verifyAdminPermission,
  updateJob,
);

export default router;
