import { Router } from 'express';
import { verifyUserPermission } from '../middlewares/verifyUserPermission.js';
import { updateUserAccount } from '../controllers/user.controller.js';
import { verifyAccessToken } from '../middlewares/auth.js';

const router = Router();

// router.put('/api/user/update', verifyAccessToken, updateUserAccount);
router.put('/user/:id', verifyAccessToken, updateUserAccount);

export default router;
