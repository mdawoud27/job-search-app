import { Router } from 'express';
import { Authorization } from '../middlewares/auth.middleware.js';
import { userController } from '../container.js';
import { upload } from '../utils/multer.js';

const router = Router();

router.get(
  '/api/users/:id',
  Authorization.verifyToken,
  Authorization.verifyUserPermission,
  (req, res, next) => userController.getProfile(req, res, next),
);

// Authenticated user endpoints
router.get('/api/user/profile', Authorization.verifyToken, (req, res, next) =>
  userController.getLoggedUser(req, res, next),
);

router.put(
  '/api/user/profile',
  Authorization.verifyToken,
  // Authorization.onlySelf,
  (req, res, next) => userController.updateAccount(req, res, next),
);

router.patch(
  '/api/user/profile/password',
  Authorization.verifyToken,
  // Authorization.onlySelf,
  (req, res, next) => userController.updatePassword(req, res, next),
);

// Images
router.patch(
  '/api/user/profile/profile-pic',
  Authorization.verifyToken,
  upload.single('image'),
  (req, res, next) => userController.uploadProfilePic(req, res, next),
);

router.patch(
  '/api/user/profile/cover-pic',
  Authorization.verifyToken,
  upload.single('image'),
  (req, res, next) => userController.uploadCoverPic(req, res, next),
);

router.delete(
  '/api/user/profile/profile-pic',
  Authorization.verifyToken,
  (req, res, next) => userController.deleteProfilePic(req, res, next),
);
router.delete(
  '/api/user/profile/cover-pic',
  Authorization.verifyToken,
  (req, res, next) => userController.deleteCoverPic(req, res, next),
);

router.delete('/api/user/delete', Authorization.verifyToken, (req, res, next) =>
  userController.softDelete(req, res, next),
);

// For admins only
router.delete(
  '/api/user/:id/delete',
  Authorization.verifyToken,
  Authorization.verifyUserPermission,
  (req, res, next) => userController.softDelete(req, res, next),
);

router.post(
  '/api/user/:id/restore',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  (req, res, next) => userController.restore(req, res, next),
);

export default router;
