import { Router } from 'express';
import { confirmOTP, signup } from '../controllers/auth.controller.js';

const router = Router();

router.post('/api/auth/signup', signup);
router.post('/api/auth/confirm-otp', confirmOTP);

export default router;
