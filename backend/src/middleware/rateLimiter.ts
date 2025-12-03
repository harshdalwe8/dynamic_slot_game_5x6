import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const spinLimiter = rateLimit({
  windowMs: parseInt(process.env.SPIN_RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.SPIN_RATE_LIMIT_MAX_REQUESTS || '30'),
  message: 'Too many spin requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return (req as any).user?.id || req.ip;
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
