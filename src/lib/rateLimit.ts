/**
 * Sistema de rate limiting usando Redis ou memória global.
 * Limita requisições por janela de tempo para prevenir abuso.
 */

import { Redis } from "@upstash/redis";

type RateLimitResult = {
  ok: boolean; // Se requisição é permitida
  remaining: number; // Requisições restantes
  resetSeconds: number; // Segundos até reset
};

const WINDOW_SECONDS = 60; // Janela de 60 segundos
const MAX_PER_WINDOW = 5; // Máximo 5 por janela

type RateLimitGlobal = typeof globalThis & {
  __RATE_LIMIT__?: Map<string, { count: number; resetAt: number }>;
};

const g = globalThis as RateLimitGlobal;
g.__RATE_LIMIT__ ??= new Map<string, { count: number; resetAt: number }>();
const memoryStore: Map<string, { count: number; resetAt: number }> = g.__RATE_LIMIT__;

let redisClient: Redis | null = null;

// Verifica se Redis está configurado
function isRedisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// Obtém cliente Redis
function getRedis(): Redis {
  redisClient ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return redisClient;
}

// Timestamp atual em segundos
function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

// Verifica rate limit para uma chave
export async function rateLimit(key: string): Promise<RateLimitResult> {
  const now = nowSeconds();
  const windowStart = now - (now % WINDOW_SECONDS);
  const resetAt = windowStart + WINDOW_SECONDS;
  const redisKey = `rl:${key}:${windowStart}`;

  if (!isRedisConfigured()) {
    // Usando memória
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

  // Usando Redis
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
