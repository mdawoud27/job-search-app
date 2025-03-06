import { Router } from 'express';
import { verifyUserPermission } from '../middlewares/verifyUserPermission';
import { updateUserAccount } from '../controllers/user.controller';
import { verifyAccessToken } from '../middlewares/verifyAccessToken';

const router = Router();

router.put('/user/update', verifyAccessToken, updateUserAccount);

router.put(
  '/api/user/:userId',
  verifyAccessToken,
  verifyUserPermission,
  updateUserAccount,
);

export default router;
