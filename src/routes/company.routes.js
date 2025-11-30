import { Router } from 'express';
import { Authorization } from '../middlewares/auth.middleware.js';
import { apiLimiter } from '../utils/apiLimiter.js';
import { companyController } from '../container.js';
import { upload } from '../utils/multer.js';

const router = Router();

router.post(
  '/company/create',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.createCompany(req, res, next);
  },
);

router.put(
  '/company/:id',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.updateCompany(req, res, next);
  },
);

router.delete(
  '/company/:id',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.softDeleteCompany(req, res, next);
  },
);

router.get(
  '/company/:id',
  apiLimiter,
  Authorization.verifyToken,
  (req, res, next) => {
    companyController.getSpecificCompanyWithJobs(req, res, next);
  },
);

router.get(
  '/company/search/:name',
  apiLimiter,
  Authorization.verifyToken,
  (req, res, next) => {
    companyController.searchCompanywithName(req, res, next);
  },
);

router.patch(
  '/company/:id/logo',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  upload.single('image'),
  (req, res, next) => {
    companyController.uploadCompanyLogo(req, res, next);
  },
);

router.delete(
  '/company/:id/logo',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.deleteCompanyLogo(req, res, next);
  },
);

router.patch(
  '/company/:id/cover',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  upload.single('image'),
  (req, res, next) => {
    companyController.uploadCompanyCover(req, res, next);
  },
);

router.delete(
  '/company/:id/cover',
  apiLimiter,
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    companyController.deleteCompanyCover(req, res, next);
  },
);

export default router;
