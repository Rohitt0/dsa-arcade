import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { badRequest } from '../lib/errors';

/** Validates and replaces req.body with the parsed value. */
export const validateBody =
  (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(badRequest('Validation failed', result.error.flatten().fieldErrors));
    }
    req.body = result.data;
    next();
  };
