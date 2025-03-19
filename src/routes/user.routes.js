import { Router } from 'express';
import {
  deleteCoverPic,
  deleteProfilePic,
  getUserProfile,
  softDeleteAccount,
  updateUserAccount,
  updateUserPassword,
  uploadCoverPic,
  uploadProfilePic,
} from '../controllers/user.controller.js';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyUserPermission } from '../middlewares/verifyUserPermission.js';
import { upload } from '../utils/imageStorage.js';
import { apiLimiter } from '../utils/apiLimiter.js';

const router = Router();

// Update user account
router.put(
  '/user/:id',
  apiLimiter,
  verifyAccessToken,
  verifyUserPermission,
  updateUserAccount,
);

// Retrive user profile date
router.get('/user/profile', apiLimiter, verifyAccessToken, getUserProfile);

// Update user password
router.patch(
  '/user/profile/password',
  apiLimiter,
  verifyAccessToken,
  updateUserPassword,
);

// Upload profile picture
router.post(
  '/user/profile/profile-pic',
  apiLimiter,
  verifyAccessToken,
  upload.single('profilePic'),
  uploadProfilePic,
);

// Upload cover picture
router.post(
  '/user/profile/cover-pic',
  apiLimiter,
  verifyAccessToken,
  upload.single('coverPic'),
  uploadCoverPic,
);

// Delete profile picture
router.delete(
  '/user/profile/profile-pic',
  apiLimiter,
  verifyAccessToken,
  deleteProfilePic,
);

// Delete cover picture
router.delete(
  '/user/profile/cover-pic',
  apiLimiter,
  verifyAccessToken,
  deleteCoverPic,
);

// Soft delete user account
router.delete('/user/delete', apiLimiter, verifyAccessToken, softDeleteAccount);

export default router;
