import { logger } from "./logger";
import { type AppRedisClient } from "./redis";

const CACHE_PREFIX = "somnia:v1";

export const createCacheKey = (
  scope: string,
  parts: Array<string | number | boolean | null | undefined>,
) =>
  [
    CACHE_PREFIX,
    scope,
    ...parts.map((part) => encodeURIComponent(String(part))),
  ].join(":");

export const getOrSetJsonCache = async <T>({
  redis,
  key,
  ttlSeconds,
  load,
}: {
  redis: AppRedisClient | null;
  key: string;
  ttlSeconds: number;
  load: () => Promise<T>;
}): Promise<T> => {
  if (!redis?.isReady) {
    return load();
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      logger.info("cache:hit", "Cache hit", { key });
      return JSON.parse(cached.toString()) as T;
    }
    logger.info("cache:miss", "Cache miss", { key });
  } catch (error) {
    logger.error("cache:get:error", error, { key });
  }

  const value = await load();

  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    logger.info("cache:set", "Cache set", { key, ttlSeconds });
  } catch (error) {
    logger.error("cache:set:error", error, { key, ttlSeconds });
  }

  return value;
};
