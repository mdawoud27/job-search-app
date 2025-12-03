import { Router } from 'express';
import { chatController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/chat/:userId', Authorization.verifyToken, (req, res, next) => {
  chatController.getChatHistory(req, res, next);
});

export default router;
