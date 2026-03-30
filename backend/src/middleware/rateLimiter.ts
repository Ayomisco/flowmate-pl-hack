import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  // With trust proxy = 1, express-rate-limit uses X-Forwarded-For safely
  validate: { xForwardedForHeader: false }, // suppress false-positive warning
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false },
});
