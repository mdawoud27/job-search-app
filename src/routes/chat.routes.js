import { Router } from 'express';
import { chatController } from '../container.js';

const router = Router();

router.get('/chat/:userId', (req, res, next) => {
  chatController.getChatHistory(req, res, next);
});

router.get('/chat', (req, res, next) => {
  chatController.getUserChats(req, res, next);
});

export default router;
