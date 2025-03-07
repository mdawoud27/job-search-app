import { Router } from 'express';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyAdminPermission } from '../middlewares/verifyAdminPermission.js';
import { banOrUnbanUser } from '../controllers/admin.controller.js';

const router = Router();

// Ban or unbanned specific user
router.patch(
  '/admin/ban',
  verifyAccessToken,
  verifyAdminPermission,
  banOrUnbanUser,
);

export default router;
