import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/async-handler';
import { listRegions } from './region.service';

async function list(_req: Request, res: Response) {
  const regions = await listRegions();
  res.json({ regions });
}

export const regionRouter = Router();
regionRouter.get('/', requireAuth, asyncHandler(list));
