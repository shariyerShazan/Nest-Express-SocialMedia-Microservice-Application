import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { requireAuth } from '../../middlewares/authMiddleware';
import { authLimiter } from '../../middlewares/rateLimiter';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './dto/auth.schema';

const router = Router();

// Apply strict rate limiting to sensitive auth routes
router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/verify-email', validateRequest(verifyEmailSchema), AuthController.verifyEmail);
router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), AuthController.resetPassword);
router.post('/logout', AuthController.logout);

// Protected
router.get('/me', requireAuth, AuthController.getProfile);

export { router as authRoutes };
