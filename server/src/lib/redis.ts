import { createClient } from "redis";

import { env } from "./env";
import { logger } from "./logger";

export type AppRedisClient = ReturnType<typeof createClient>;

export const createAppRedisClient = (): AppRedisClient | null => {
  if (!env.REDIS_URL) {
    return null;
  }

  const redis = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 2_000),
    },
  });

  redis.on("error", (error) => {
    logger.error("redis:error", error);
  });

  void redis
    .connect()
    .then(() => {
      logger.info("redis:connect", "Redis cache connected", {
        url: env.REDIS_URL,
      });
    })
    .catch((error) => {
      logger.error("redis:connect:error", error);
    });

  return redis;
};
