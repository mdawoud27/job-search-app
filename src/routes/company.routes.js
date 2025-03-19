import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';
import {
  addCompany,
  deleteCompanyCoverPic,
  deleteCompanyLogo,
  getCompanyWithJobs,
  searchCompaniesByName,
  softDeleteCompany,
  updateCompany,
  uploadCompanyCoverPic,
  uploadCompanyLogo,
} from '../controllers/company.controller.js';
import { upload } from '../utils/imageStorage.js';
import { apiLimiter } from '../utils/apiLimiter.js';

const router = Router();

// Add company
router.post(
  '/api/company',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  addCompany,
);

// Update company
router.put(
  '/api/company/:companyId',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  updateCompany,
);

// Soft delete company
router.delete(
  '/api/company/:companyId',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  softDeleteCompany,
);

// Get company with jobs
router.get(
  '/api/company/:companyId',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  getCompanyWithJobs,
);

// Search for company by name
router.get(
  '/api/company/',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  searchCompaniesByName,
);

// Upload company logo
router.post(
  '/api/company/:companyId/logo',
  verifyAccessToken,
  upload.single('image'),
  apiLimiter,
  uploadCompanyLogo,
);

// Upload company cover pic
router.post(
  '/api/company/:companyId/cover-pic',
  verifyAccessToken,
  upload.single('image'),
  apiLimiter,
  uploadCompanyCoverPic,
);

// Delete company logo
router.delete(
  '/api/company/:companyId/logo',
  verifyAccessToken,
  apiLimiter,
  deleteCompanyLogo,
);

// Delete company cover pic
router.delete(
  '/api/company/:companyId/cover-pic',
  verifyAccessToken,
  apiLimiter,
  deleteCompanyCoverPic,
);

export default router;
