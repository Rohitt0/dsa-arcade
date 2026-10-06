import { Router } from 'express';
import type { Request, Response } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/user/user.routes';
import { regionRouter } from './modules/region/region.routes';
import { patternRouter } from './modules/pattern/pattern.routes';
import { challengeRouter } from './modules/challenge/challenge.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/', userRouter); // GET /api/me
apiRouter.use('/regions', regionRouter);
apiRouter.use('/patterns', patternRouter);
apiRouter.use('/challenges', challengeRouter);
