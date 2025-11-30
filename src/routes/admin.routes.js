import { Router } from 'express';
import { adminController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';

const router = Router();

router.patch(
  '/admin/ban-user',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.banUser(req, res, next),
);

router.patch(
  '/admin/unban-user',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.unbanUser(req, res, next),
);

router.patch(
  '/admin/ban-company',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.banCompany(req, res, next),
);

router.patch(
  '/admin/unban-company',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.unbanCompany(req, res, next),
);

router.patch(
  '/admin/approve-company',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.approveCompany(req, res, next),
);

export default router;
