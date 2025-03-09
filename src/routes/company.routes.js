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

// Upload company cover pic
router.post(
  '/api/company/:companyId/cover-pic',
  verifyAccessToken,
  upload.single('image'),
  uploadCompanyCoverPic,
);

// Delete company logo
router.delete(
  '/api/company/:companyId/logo',
  verifyAccessToken,
  deleteCompanyLogo,
);

// Delete company cover pic
router.delete(
  '/api/company/:companyId/cover-pic',
  verifyAccessToken,
  deleteCompanyCoverPic,
);

export default router;
