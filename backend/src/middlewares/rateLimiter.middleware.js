import rateLimit from 'express-rate-limit';

const windowMinutes = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES) || 15;
const maxAttempts = Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 10;

export const loginRateLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: maxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many login attempts. Please wait ${windowMinutes} minutes before trying again.`,
  },
});
