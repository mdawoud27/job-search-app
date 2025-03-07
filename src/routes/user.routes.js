import { Router } from 'express';
import {
  getUserProfile,
  updateUserAccount,
  updateUserPassword,
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

export default router;
