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

const router = Router();

router.put(
  '/user/:id',
  verifyAccessToken,
  verifyUserPermission,
  updateUserAccount,
);
router.get('/user/profile', verifyAccessToken, getUserProfile);
router.patch('/user/profile/password', verifyAccessToken, updateUserPassword);

router.post(
  '/usr/profile/profile-pic',
  verifyAccessToken,
  upload.single('profilePic'),
  uploadProfilePic,
);

router.post(
  '/usr/profile/cover-pic',
  verifyAccessToken,
  upload.single('coverPic'),
  uploadCoverPic,
);

// Delete profile picture
router.delete('/user/profile/profile-pic', verifyAccessToken, deleteProfilePic);

// Delete cover picture
router.delete('/user/profile/cover-pic', verifyAccessToken, deleteCoverPic);

// Soft delete user account
router.delete('/user/delete', verifyAccessToken, softDeleteAccount);

export default router;
