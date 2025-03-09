import { Router } from 'express';
import { addJob } from '../controllers/job.controller.js';
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

export default router;
