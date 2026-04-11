import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', data: null, error: 'RATE_LIMITED' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 attempts per 15 min
  skipSuccessfulRequests: true, // Only count failed requests
  message: { success: false, message: 'Too many login attempts', data: null, error: 'RATE_LIMITED' },
});
