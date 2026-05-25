import { createPrismaClient } from './prisma';
import { createAppRedisClient } from './redis';

export const createAppContext = () => {
  const prisma = createPrismaClient();
  const redis = createAppRedisClient();
  return {
    prisma,
    redis,
    stop: async () => {
      await prisma.$disconnect();
      if (redis?.isOpen) {
        await redis.quit();
      }
    },
  };
};

export type AppContext = ReturnType<typeof createAppContext>;
