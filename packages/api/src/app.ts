import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error';
import { notFound } from './lib/errors';
import { env } from './config/env';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', apiRouter);

  app.use((_req, _res, next) => next(notFound('Route not found')));
  app.use(errorHandler);

  return app;
}
