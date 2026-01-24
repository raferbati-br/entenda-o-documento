import { Redis } from "@upstash/redis";

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
};

const WINDOW_SECONDS = 60;
const MAX_PER_WINDOW = 5;

type RateLimitGlobal = typeof globalThis & {
  __RATE_LIMIT__?: Map<string, { count: number; resetAt: number }>;
};

const g = globalThis as RateLimitGlobal;
g.__RATE_LIMIT__ = g.__RATE_LIMIT__ || new Map<string, { count: number; resetAt: number }>();
const memoryStore: Map<string, { count: number; resetAt: number }> = g.__RATE_LIMIT__;

let redisClient: Redis | null = null;

function isRedisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

export async function rateLimit(key: string): Promise<RateLimitResult> {
  const now = nowSeconds();
  const windowStart = now - (now % WINDOW_SECONDS);
  const resetAt = windowStart + WINDOW_SECONDS;
  const redisKey = `rl:${key}:${windowStart}`;

  if (!isRedisConfigured()) {
    const entry = memoryStore.get(redisKey);
    if (!entry || entry.resetAt <= now) {
      memoryStore.set(redisKey, { count: 1, resetAt });
      return { ok: true, remaining: MAX_PER_WINDOW - 1, resetSeconds: resetAt - now };
    }
    entry.count += 1;
    memoryStore.set(redisKey, entry);
    return {
      ok: entry.count <= MAX_PER_WINDOW,
      remaining: Math.max(0, MAX_PER_WINDOW - entry.count),
      resetSeconds: Math.max(1, resetAt - now),
    };
  }

  const redis = getRedis();
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, WINDOW_SECONDS);
  }
  return {
    ok: count <= MAX_PER_WINDOW,
    remaining: Math.max(0, MAX_PER_WINDOW - count),
    resetSeconds: Math.max(1, resetAt - now),
  };
}
