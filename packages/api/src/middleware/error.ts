import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ error: { message: err.message, code: err.code, details: err.details } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Invalid JSON body', code: 'BAD_JSON' } });
  }
  logger.error(err);
  res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL' } });
};
