import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';
import {
  addCompany,
  getCompanyWithJobs,
  softDeleteCompany,
  updateCompany,
} from '../controllers/company.controller.js';

const router = Router();

// Add company
router.post(
  '/api/company',
  verifyAccessToken,
  verifyAdminPermission,
  addCompany,
);

// Update company
router.put(
  '/api/company/:companyId',
  verifyAccessToken,
  verifyAdminPermission,
  updateCompany,
);

// Soft delete company
router.delete(
  '/api/company/:companyId',
  verifyAccessToken,
  verifyAdminPermission,
  softDeleteCompany,
);

// Get company with jobs
router.get(
  '/api/company/:companyId',
  verifyAccessToken,
  verifyAdminPermission,
  getCompanyWithJobs,
);

export default router;
