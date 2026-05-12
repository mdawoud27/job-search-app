import { Router } from 'express';
import { authController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route POST /api/v1/auth/signup
 * @desc Register a new user
 * @access Public
 */
router.post('/auth/signup', (req, res, next) => {
  authController.signup(req, res, next);
});

/**
 * @route POST /api/v1/auth/confirm-otp
 * @desc Confirm OTP
 * @access Public
 */
router.post('/auth/confirm-otp', (req, res, next) => {
  authController.confirm(req, res, next);
});

/**
 * @route POST /api/v1/auth/resend-otp
 * @desc Resend OTP
 * @access Public
 */
router.post('/auth/resend-otp', (req, res, next) => {
  authController.resentOTP(req, res, next);
});

/**
 * @route POST /api/v1/auth/signin
 * @desc Sign in
 * @access Public
 */
router.post('/auth/signin', (req, res, next) => {
  authController.login(req, res, next);
});

/**
 * @route POST /api/v1/auth/forget-password
 * @desc Forget password
 * @access Public
 */
router.post('/auth/forget-password', (req, res, next) => {
  authController.forgotPassword(req, res, next);
});

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password
 * @access Public
 */
router.post('/auth/reset-password', (req, res, next) => {
  authController.resetPassword(req, res, next);
});

/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Refresh token
 * @access Public
 */
router.post('/auth/refresh-token', (req, res, next) => {
  authController.refreshToken(req, res, next);
});

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout
 * @access Private
 */
router.post('/auth/logout', Authorization.verifyToken, (req, res, next) => {
  authController.logout(req, res, next);
});

/**
 * @route GET /api/v1/auth/google
 * @desc Google OAuth
 * @access Public
 */
router.get('/auth/google', (req, res, next) => {
  authController.googleAuth(req, res, next);
});

/**
 * @route GET /api/v1/auth/google/callback
 * @desc Google OAuth callback
 * @access Public
 */
router.get('/auth/google/callback', (req, res, next) => {
  authController.googleCallback(req, res, next);
});

export default router;
