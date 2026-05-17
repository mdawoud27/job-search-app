import { Router } from 'express';
import { Authorization } from '../middlewares/auth.middleware.js';
import { apiLimiter } from '../utils/apiLimiter.js';
import { companyController } from '../container.js';
import { uploadImage } from '../utils/multer.js';

const router = Router();

/**
 * @route POST /api/v1/company/create
 * @desc Create company
 * @access Private
 */
router.post(
  '/company/create',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.createCompany(req, res, next);
  },
);

/**
 * @route PUT /api/v1/company/:id
 * @desc Update company
 * @access Private
 */
router.put(
  '/company/:id',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.updateCompany(req, res, next);
  },
);

/**
 * @route DELETE /api/v1/company/:id
 * @desc Delete company
 * @access Private
 */
router.delete(
  '/company/:id',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.softDeleteCompany(req, res, next);
  },
);

/**
 * @route GET /api/v1/company/search/:name
 * @desc Search company by name
 * @access Private
 */
router.get(
  '/company/search/:name',
  apiLimiter,
  Authorization.verifyToken,
  (req, res, next) => {
    companyController.searchCompanywithName(req, res, next);
  },
);

/**
 * @route GET /api/v1/company/:id
 * @desc Get company with jobs
 * @access Private
 */
router.get(
  '/company/:id',
  apiLimiter,
  Authorization.verifyToken,
  (req, res, next) => {
    companyController.getSpecificCompanyWithJobs(req, res, next);
  },
);

/**
 * @route PATCH /api/v1/company/:id/logo
 * @desc Upload company logo
 * @access Private
 */
router.patch(
  '/company/:id/logo',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  uploadImage.single('image'),
  (req, res, next) => {
    companyController.uploadCompanyLogo(req, res, next);
  },
);

/**
 * @route DELETE /api/v1/company/:id/logo
 * @desc Delete company logo
 * @access Private
 */
router.delete(
  '/company/:id/logo',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.deleteCompanyLogo(req, res, next);
  },
);

/**
 * @route PATCH /api/v1/company/:id/cover
 * @desc Upload company cover
 * @access Private
 */
router.patch(
  '/company/:id/cover',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  uploadImage.single('image'),
  (req, res, next) => {
    companyController.uploadCompanyCover(req, res, next);
  },
);

/**
 * @route DELETE /api/v1/company/:id/cover
 * @desc Delete company cover
 * @access Private
 */
router.delete(
  '/company/:id/cover',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.deleteCompanyCover(req, res, next);
  },
);

/**
 * @route POST /api/v1/company/:id/hr
 * @desc Add HR to company
 * @access Private
 */
router.post(
  '/company/:id/hr',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.addHR(req, res, next);
  },
);

/**
 * @route DELETE /api/v1/company/:id/hr
 * @desc Remove HR from company
 * @access Private
 */
router.delete(
  '/company/:id/hr',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.removeHR(req, res, next);
  },
);

export default router;
