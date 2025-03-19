import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';
import {
  approveCompany,
  banOrUnbanCompany,
  banOrUnbanUser,
} from '../controllers/admin.controller.js';
import { apiLimiter } from '../utils/apiLimiter.js';

const router = Router();

// Ban or unbanned specific user
router.patch(
  '/admin/user/ban',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  banOrUnbanUser,
);

// Ban or unbanned specific company
router.patch(
  '/admin/company/ban',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  banOrUnbanCompany,
);

// Approve Company
router.patch(
  '/admin/company/approve',
  verifyAccessToken,
  verifyAdminPermission,
  apiLimiter,
  approveCompany,
);

export default router;
