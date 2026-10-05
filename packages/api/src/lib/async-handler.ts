import type { RequestHandler } from 'express';

/** Wraps an async route handler so thrown/rejected errors reach Express's error handler. */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
