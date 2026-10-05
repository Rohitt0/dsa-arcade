import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/async-handler';
import { badRequest } from '../../lib/errors';
import { getPatternBySlug } from './pattern.service';

async function getBySlug(req: Request, res: Response) {
  const slug = req.params.slug;
  if (!slug) throw badRequest('Missing pattern slug');
  const pattern = await getPatternBySlug(slug);
  res.json({ pattern });
}

export const patternRouter = Router();
patternRouter.get('/:slug', requireAuth, asyncHandler(getBySlug));
