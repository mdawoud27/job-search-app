import { Router } from 'express';
import { Authorization } from '../middlewares/auth.middleware.js';
import { userController } from '../container.js';
import { uploadImage } from '../utils/multer.js';

const router = Router();

/**
 * @route GET /api/v1/users/:id
 * @desc Get user profile
 * @access Private
 */
router.get(
  '/users/:id',
  Authorization.verifyToken,
  Authorization.verifyUserPermission,
  (req, res, next) => userController.getProfile(req, res, next),
);

/**
 * @route GET /api/v1/user/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/user/profile', Authorization.verifyToken, (req, res, next) =>
  userController.getLoggedUser(req, res, next),
);

/**
 * @route PUT /api/v1/user/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/user/profile',
  Authorization.verifyToken,
  // Authorization.onlySelf,
  (req, res, next) => userController.updateAccount(req, res, next),
);

/**
 * @route PATCH /api/v1/user/profile/password
 * @desc Update user password
 * @access Private
 */
router.patch(
  '/user/profile/password',
  Authorization.verifyToken,
  // Authorization.onlySelf,
  (req, res, next) => userController.updatePassword(req, res, next),
);

/**
 * @route PATCH /api/v1/user/profile/profile-pic
 * @desc Update user profile picture
 * @access Private
 */
router.patch(
  '/user/profile/profile-pic',
  Authorization.verifyToken,
  uploadImage.single('image'),
  (req, res, next) => userController.uploadProfilePic(req, res, next),
);

/**
 * @route PATCH /api/v1/user/profile/cover-pic
 * @desc Update user cover picture
 * @access Private
 */
router.patch(
  '/user/profile/cover-pic',
  Authorization.verifyToken,
  uploadImage.single('image'),
  (req, res, next) => userController.uploadCoverPic(req, res, next),
);

/**
 * @route DELETE /api/v1/user/profile/profile-pic
 * @desc Delete user profile picture
 * @access Private
 */
router.delete(
  '/user/profile/profile-pic',
  Authorization.verifyToken,
  (req, res, next) => userController.deleteProfilePic(req, res, next),
);

/**
 * @route DELETE /api/v1/user/profile/cover-pic
 * @desc Delete user cover picture
 * @access Private
 */
router.delete(
  '/user/profile/cover-pic',
  Authorization.verifyToken,
  (req, res, next) => userController.deleteCoverPic(req, res, next),
);

/**
 * @route DELETE /api/v1/user/delete
 * @desc Delete user
 * @access Private
 */
router.delete('/user/delete', Authorization.verifyToken, (req, res, next) =>
  userController.softDelete(req, res, next),
);

/**
 * @route DELETE /api/v1/user/:id/delete
 * @desc Delete user
 * @access Private
 */
router.delete(
  '/user/:id/delete',
  Authorization.verifyToken,
  Authorization.verifyUserPermission,
  (req, res, next) => userController.softDelete(req, res, next),
);

/**
 * @route POST /api/v1/user/:id/restore
 * @desc Restore user
 * @access Private
 */
router.post(
  '/user/:id/restore',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => userController.restore(req, res, next),
);

export default router;
