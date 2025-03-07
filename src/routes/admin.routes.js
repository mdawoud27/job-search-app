import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';
import {
  banOrUnbanCompany,
  banOrUnbanUser,
} from '../controllers/admin.controller.js';

const router = Router();

// Ban or unbanned specific user
router.patch(
  '/admin/user/ban',
  verifyAccessToken,
  verifyAdminPermission,
  banOrUnbanUser,
);

// Ban or unbanned specific company
router.patch(
  '/admin/company/ban',
  verifyAccessToken,
  verifyAdminPermission,
  banOrUnbanCompany,
);

export default router;
