import { Router } from 'express';
import { apiLimiter } from '../utils/apiLimiter.js';
import { authController } from '../container.js';

const router = Router();

// -------------------------
// SYSTEM AUTH ROUTES
// -------------------------

router.post('/api/auth/signup', apiLimiter, (req, res, next) =>
  authController.signup(req, res, next),
);

router.post('/api/auth/confirm-otp', apiLimiter, (req, res, next) =>
  authController.confirm(req, res, next),
);

router.post('/api/auth/resend-otp', apiLimiter, (req, res, next) =>
  authController.resentOTP(req, res, next),
);

router.post('/api/auth/signin', apiLimiter, (req, res, next) =>
  authController.login(req, res, next),
);

router.post('/api/auth/forget-password', apiLimiter, (req, res, next) =>
  authController.forgotPassword(req, res, next),
);

router.post('/api/auth/reset-password', apiLimiter, (req, res, next) =>
  authController.resetPassword(req, res, next),
);

router.post('/api/auth/refresh-token', apiLimiter, (req, res, next) =>
  authController.refreshToken(req, res, next),
);

// -------------------------
// GOOGLE OAUTH (Web)
// -------------------------

// Google OAuth routes
router.get('/api/auth/google', (req, res, next) =>
  authController.googleAuth(req, res, next),
);

router.get('/api/auth/google/callback', (req, res, next) =>
  authController.googleCallback(req, res, next),
);
export default router;
