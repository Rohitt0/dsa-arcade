import { Router } from 'express';
import { loginSchema, registerSchema } from '@dsa/shared';
import { asyncHandler } from '../../lib/async-handler';
import { validateBody } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rate-limit';
import * as c from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(c.register));
authRouter.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(c.login));
authRouter.post('/refresh', asyncHandler(c.refresh));
authRouter.post('/logout', asyncHandler(c.logout));
