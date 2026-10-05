import type { Response } from 'express';
import { env } from '../config/env';

export const REFRESH_COOKIE = 'dsa_refresh';

/** The refresh cookie is scoped to /api/auth so it is only sent to refresh/logout. */
const COOKIE_PATH = '/api/auth';

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_SEC * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
}
