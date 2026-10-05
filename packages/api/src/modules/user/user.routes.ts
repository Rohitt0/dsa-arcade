import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/async-handler';
import { getUserById } from '../auth/auth.service';

async function me(req: Request, res: Response) {
  const user = await getUserById(req.user!.id);
  res.json({ user });
}

export const userRouter = Router();
userRouter.get('/me', requireAuth, asyncHandler(me));
