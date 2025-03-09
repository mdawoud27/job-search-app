import { Router } from 'express';
import { addJob, deleteJob, updateJob } from '../controllers/job.controller.js';
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

// Delete Job (soft delete)
router.delete(
  '/api/jobs/:jobId',
  verifyAccessToken,
  verifyAdminPermission,
  deleteJob,
);

export default router;
