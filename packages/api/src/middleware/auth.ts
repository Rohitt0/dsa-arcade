import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { unauthorized } from '../lib/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; username: string };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized('Missing access token'));
  }
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch {
    next(unauthorized('Invalid or expired access token'));
  }
};
