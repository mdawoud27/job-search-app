import { Router } from 'express';
import {
  confirmOTP,
  googleOAuthCallback,
  googleOAuthLogin,
  signin,
  signup,
} from '../controllers/auth.controller.js';
import passport from 'passport';

const router = Router();

router.post('/api/auth/signup', signup);
router.post('/api/auth/confirm-otp', confirmOTP);
router.post('/api/auth/signin', signin);

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
  googleOAuthCallback,
);

// Google OAuth Login/Signup Endpoint (for mobile/SPA)
router.post('/auth/google', googleOAuthLogin);

export default router;
