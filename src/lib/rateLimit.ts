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

function getRateLimitConfig() {
  const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || "");
  const maxPerWindow = Number(process.env.RATE_LIMIT_MAX_PER_WINDOW || "");
  const disabled = process.env.RATE_LIMIT_DISABLED === "1";
  return {
    windowSeconds: Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : WINDOW_SECONDS,
    maxPerWindow: Number.isFinite(maxPerWindow) && maxPerWindow > 0 ? maxPerWindow : MAX_PER_WINDOW,
    disabled,
  };
}

// Verifica rate limit para uma chave
export async function rateLimit(key: string): Promise<RateLimitResult> {
  const { windowSeconds, maxPerWindow, disabled } = getRateLimitConfig();
  if (disabled) {
    return { ok: true, remaining: Number.MAX_SAFE_INTEGER, resetSeconds: windowSeconds };
  }

  const now = nowSeconds();
  const windowStart = now - (now % windowSeconds);
  const resetAt = windowStart + windowSeconds;
  const redisKey = `rl:${key}:${windowStart}`;

  if (!isRedisConfigured()) {
    // Usando memória
    const entry = memoryStore.get(redisKey);
    if (!entry || entry.resetAt <= now) {
      memoryStore.set(redisKey, { count: 1, resetAt });
      return { ok: true, remaining: maxPerWindow - 1, resetSeconds: resetAt - now };
    }
    entry.count += 1;
    memoryStore.set(redisKey, entry);
    return {
      ok: entry.count <= maxPerWindow,
      remaining: Math.max(0, maxPerWindow - entry.count),
      resetSeconds: Math.max(1, resetAt - now),
    };
  }

  // Usando Redis
  const redis = getRedis();
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  return {
    ok: count <= maxPerWindow,
    remaining: Math.max(0, maxPerWindow - count),
    resetSeconds: Math.max(1, resetAt - now),
  };
}
