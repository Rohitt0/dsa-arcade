import rateLimit from 'express-rate-limit';

/** Protects auth endpoints from brute-force / abuse. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts, try again later', code: 'RATE_LIMITED' } },
});
