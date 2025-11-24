import { redis } from "./redis";

export async function rateLimit(key: string, limit = 10, window = 60) {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, window);
  }

  const remaining = Math.max(limit - current, 0);
  const reset = await redis.ttl(key);

  return {
    allowed: current <= limit,
    remaining,
    reset,
  };
}
