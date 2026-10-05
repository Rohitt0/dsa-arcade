import type { Request, Response } from 'express';
import * as authService from './auth.service';
import { prisma } from '../../lib/prisma';
import { signAccessToken, verifyRefreshToken } from '../../lib/jwt';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from '../../lib/cookies';
import { unauthorized } from '../../lib/errors';

export async function register(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw unauthorized('No refresh token');

  const payload = (() => {
    try {
      return verifyRefreshToken(token);
    } catch {
      throw unauthorized('Invalid refresh token');
    }
  })();

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw unauthorized('User no longer exists');

  const accessToken = signAccessToken({ sub: user.id, username: user.username });
  res.json({ accessToken });
}

export async function logout(_req: Request, res: Response) {
  clearRefreshCookie(res);
  res.status(204).send();
}
