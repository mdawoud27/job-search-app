import { Router } from 'express';
import { confirmOTP, signin, signup } from '../controllers/auth.controller.js';

const router = Router();

router.post('/api/auth/signup', signup);
router.post('/api/auth/confirm-otp', confirmOTP);
router.post('/api/auth//signin', signin);
// router.post('/api/auth/refresh-token', refreshTokens);

export default router;
