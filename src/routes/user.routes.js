import { Router } from 'express';
import {
  getUserProfile,
  updateUserAccount,
  updateUserPassword,
} from '../controllers/user.controller.js';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyUserPermission } from '../middlewares/verifyUserPermission.js';

const router = Router();

router.put(
  '/user/:id',
  verifyAccessToken,
  verifyUserPermission,
  updateUserAccount,
);
router.get('/user/profile', verifyAccessToken, getUserProfile);
router.patch('/user/profile/password', verifyAccessToken, updateUserPassword);
export default router;
