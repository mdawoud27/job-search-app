import { Router } from 'express';
import { adminController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route PATCH /api/v1/admin/ban-user
 * @desc Ban user
 * @access Private
 */
router.patch(
  '/admin/ban-user',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.banUser(req, res, next),
);

/**
 * @route PATCH /api/v1/admin/unban-user
 * @desc Unban user
 * @access Private
 */
router.patch(
  '/admin/unban-user',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.unbanUser(req, res, next),
);

/**
 * @route PATCH /api/v1/admin/ban-company
 * @desc Ban company
 * @access Private
 */
router.patch(
  '/admin/ban-company',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.banCompany(req, res, next),
);

/**
 * @route PATCH /api/v1/admin/unban-company
 * @desc Unban company
 * @access Private
 */
router.patch(
  '/admin/unban-company',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.unbanCompany(req, res, next),
);

/**
 * @route PATCH /api/v1/admin/approve-company
 * @desc Approve company
 * @access Private
 */
router.patch(
  '/admin/approve-company',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => adminController.approveCompany(req, res, next),
);

export default router;
