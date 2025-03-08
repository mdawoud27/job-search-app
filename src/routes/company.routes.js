import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';
import {
  addCompany,
  getCompanyWithJobs,
  searchCompaniesByName,
  softDeleteCompany,
  updateCompany,
  uploadCompanyLogo,
} from '../controllers/company.controller.js';
import { upload } from '../utils/uploadImage.js';

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

// Search for company by name
router.get(
  '/api/company/',
  verifyAccessToken,
  verifyAdminPermission,
  searchCompaniesByName,
);

// Upload company logo
router.post(
  '/api/company/:companyId/logo',
  verifyAccessToken,
  upload.single('image'),
  uploadCompanyLogo,
);

export default router;
