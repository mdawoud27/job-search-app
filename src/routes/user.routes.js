import { Router } from 'express';
import { verifyUserPermission } from '../middlewares/verifyUserPermission';
import { updateUserAccount } from '../controllers/user.controller';

const router = Router();

router.put('/api/user/:userId', verifyUserPermission, updateUserAccount);

export default router;
