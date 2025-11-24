import { Router } from 'express';
import passport from 'passport';
import { apiLimiter } from '../utils/apiLimiter.js';
import { AuthController } from '../controllers/auth.controller.js';
import { authController } from '../container.js';

const router = Router();
const controller = new AuthController();

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

// Web redirect login
router.get(
  '/auth/google',
  apiLimiter,
  passport.authenticate('google', {
    scope: ['profile', 'email', 'openid'],
    prompt: 'select_account',
  }),
);

// Google OAuth callback
router.get(
  '/auth/google/callback',
  apiLimiter,
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  controller.googleOAuthCallback.bind(controller),
);

// -------------------------
// GOOGLE OAUTH (Mobile / SPA)
// -------------------------
// router.post(
//   '/auth/google',
//   apiLimiter,
//   controller.googleOAuthLogin.bind(controller),
// );

export default router;
