import { Router } from 'express';
import { apiLimiter } from '../utils/apiLimiter.js';
import { authController } from '../container.js';

const router = Router();

router.post('/auth/signup', apiLimiter, (req, res, next) =>
  authController.signup(req, res, next),
);

router.post('/auth/confirm-otp', apiLimiter, (req, res, next) =>
  authController.confirm(req, res, next),
);

router.post('/auth/resend-otp', apiLimiter, (req, res, next) =>
  authController.resentOTP(req, res, next),
);

router.post('/auth/signin', apiLimiter, (req, res, next) =>
  authController.login(req, res, next),
);

router.post('/auth/forget-password', apiLimiter, (req, res, next) =>
  authController.forgotPassword(req, res, next),
);

router.post('/auth/reset-password', apiLimiter, (req, res, next) =>
  authController.resetPassword(req, res, next),
);

router.post('/auth/refresh-token', apiLimiter, (req, res, next) =>
  authController.refreshToken(req, res, next),
);

// Google OAuth routes
router.get('/auth/google', (req, res, next) =>
  authController.googleAuth(req, res, next),
);

router.get('/auth/google/callback', (req, res, next) =>
  authController.googleCallback(req, res, next),
);
export default router;
