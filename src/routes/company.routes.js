import { Router } from 'express';
import { Authorization } from '../middlewares/auth.middleware.js';
import { apiLimiter } from '../utils/apiLimiter.js';
import { companyController } from '../container.js';

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

export default router;
