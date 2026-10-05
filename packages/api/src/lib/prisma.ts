import { PrismaClient } from '@prisma/client';
import { isDev } from '../config/env';

export const prisma = new PrismaClient({
  log: isDev ? ['warn', 'error'] : ['error'],
});
