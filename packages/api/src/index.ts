import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`🎮 DSA Arcade API listening on http://localhost:${env.PORT}`);
});
