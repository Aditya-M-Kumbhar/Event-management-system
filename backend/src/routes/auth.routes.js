const express  = require('express');
const passport = require('passport');
const router   = express.Router();

const authController     = require('../controllers/auth/auth.controller');
const passwordController = require('../controllers/auth/password.controller');
const { protect }        = require('../middleware/auth.middleware');
const { authLimiter }    = require('../middleware/rateLimiter.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// ─── Local Auth ───────────────────────────────────────────────────────────────
router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/login',    authLimiter, validateRequest(loginSchema),    authController.login);
router.post('/logout',   authController.logout);
router.post('/refresh',  authController.refreshToken);
router.get('/me',        protect, authController.getMe);
router.put('/change-password', protect, authController.changePassword);

// ─── Forgot / Reset Password ──────────────────────────────────────────────────
router.post('/forgot-password', authLimiter, passwordController.forgotPassword);
router.post('/reset-password/:token', passwordController.resetPassword);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` }),
  authController.googleCallback
);

module.exports = router;
