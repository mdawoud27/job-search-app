import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission';
import { addCompany } from '../controllers/company.controller';

const router = Router();

// Add company
router.post(
  '/api/company',
  verifyAccessToken,
  verifyAdminPermission,
  addCompany,
);

export default router;
