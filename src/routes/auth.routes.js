import { Router } from 'express';
import {
  confirmOTP,
  googleOAuthCallback,
  googleOAuthLogin,
  refreshAccessToken,
  resetPassword,
  sendForgetPasswordOTP,
  signin,
  signup,
} from '../controllers/auth.controller.js';
import passport from 'passport';
import { apiLimiter } from '../utils/apiLimiter.js';

const router = Router();

router.post('/api/auth/signup', apiLimiter, signup);
router.post('/api/auth/confirm-otp', apiLimiter, confirmOTP);
router.post('/api/auth/signin', apiLimiter, signin);

// Google OAuth Routes
// Initiate Google OAuth authentication
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'openid'],
    prompt: 'select_account',
  }),
);

// Google OAuth callback
router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  apiLimiter,
  googleOAuthCallback,
);

// Google OAuth Login/Signup Endpoint (for mobile/SPA)
router.post('/auth/google', apiLimiter, googleOAuthLogin);

router.post('/api/auth/forget-password', apiLimiter, sendForgetPasswordOTP);
router.post('/api/auth/reset-password', apiLimiter, resetPassword);
router.post('/api/auth/refresh-token', apiLimiter, refreshAccessToken);

export default router;
