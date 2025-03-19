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
  verifyAccessToken,
  verifyUserPermission,
  apiLimiter,
  updateUserAccount,
);

// Retrive user profile date
router.get('/user/profile', verifyAccessToken, apiLimiter, getUserProfile);

// Update user password
router.patch(
  '/user/profile/password',
  verifyAccessToken,
  apiLimiter,
  updateUserPassword,
);

// Upload profile picture
router.post(
  '/user/profile/profile-pic',
  verifyAccessToken,
  upload.single('profilePic'),
  apiLimiter,
  uploadProfilePic,
);

// Upload cover picture
router.post(
  '/user/profile/cover-pic',
  verifyAccessToken,
  upload.single('coverPic'),
  apiLimiter,
  uploadCoverPic,
);

// Delete profile picture
router.delete(
  '/user/profile/profile-pic',
  verifyAccessToken,
  apiLimiter,
  deleteProfilePic,
);

// Delete cover picture
router.delete(
  '/user/profile/cover-pic',
  verifyAccessToken,
  apiLimiter,
  deleteCoverPic,
);

// Soft delete user account
router.delete('/user/delete', verifyAccessToken, apiLimiter, softDeleteAccount);

export default router;
