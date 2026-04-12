import { createClient } from 'redis';
import { env } from './env';

export const redis = env.redisUrl
  ? createClient({
      url: env.redisUrl,
    })
  : null;

export async function connectRedis(): Promise<boolean> {
  if (!redis) return false;
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    return true;
  } catch {
    return false;
  }
}
