import { Router } from 'express';
import { updateUserAccount } from '../controllers/user.controller.js';
import { verifyAccessToken } from '../middlewares/auth.js';
import { verifyUserPermission } from '../middlewares/verifyUserPermission.js';

const router = Router();

// router.put('/user/update', verifyAccessToken, updateUserAccount);
router.put(
  '/user/:id',
  verifyAccessToken,
  verifyUserPermission,
  updateUserAccount,
);

export default router;
