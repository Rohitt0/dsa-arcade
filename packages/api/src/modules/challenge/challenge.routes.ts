import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { badRequest } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { submissionLimiter } from '../../middleware/rate-limit';
import { getChallengeBySlug, runChallenge, submitChallenge } from './challenge.service';

const submitSchema = z.object({ code: z.string().min(1).max(30_000) });

async function getBySlug(req: Request, res: Response) {
  const slug = req.params.slug;
  if (!slug || slug.length > 120) throw badRequest('Invalid challenge slug');
  const challenge = await getChallengeBySlug(slug, req.user?.id);
  res.json({ challenge });
}

async function submit(req: Request, res: Response) {
  const slug = req.params.slug;
  const userId = req.user?.id;
  if (!slug || slug.length > 120) throw badRequest('Invalid challenge slug');
  if (!userId) throw badRequest('Authenticated user is required');
  const result = await submitChallenge(userId, slug, req.body.code as string);
  res.json({ result });
}

async function runExamples(req: Request, res: Response) {
  const slug = req.params.slug;
  if (!slug || slug.length > 120) throw badRequest('Invalid challenge slug');
  const result = await runChallenge(slug, req.body.code as string);
  res.json({ result });
}

export const challengeRouter = Router();
challengeRouter.get('/:slug', requireAuth, asyncHandler(getBySlug));
challengeRouter.post(
  '/:slug/run',
  requireAuth,
  submissionLimiter,
  validateBody(submitSchema),
  asyncHandler(runExamples),
);
challengeRouter.post(
  '/:slug/submissions',
  requireAuth,
  submissionLimiter,
  validateBody(submitSchema),
  asyncHandler(submit),
);
