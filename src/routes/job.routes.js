import { Router } from 'express';
import {
  addJob,
  deleteJob,
  getJobById,
  getJobs,
  updateJob,
} from '../controllers/job.controller.js';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';

const router = Router({ mergeParams: true });

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

// Get all jobs
router.get('/api/jobs/', getJobs);

// Get Job by id
router.get('/api/jobs/:jobId', getJobById);

export default router;
