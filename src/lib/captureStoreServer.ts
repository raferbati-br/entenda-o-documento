import { Redis } from "@upstash/redis";

export type CaptureEntry = {
  imageBase64: string; // DataURL
  mimeType: string;
  createdAt: number;
  bytes: number;
};

const TTL_MS = 10 * 60 * 1000;

const g = globalThis as any;
g.__CAPTURE_STORE__ = g.__CAPTURE_STORE__ || new Map<string, CaptureEntry>();
const memoryStore: Map<string, CaptureEntry> = g.__CAPTURE_STORE__;

let redisClient: Redis | null = null;

export function isRedisConfigured() {
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

function keyFor(id: string) {
  return `capture:${id}`;
}

export function cleanupMemoryStore() {
  if (isRedisConfigured()) return;
  const t = Date.now();
  for (const [id, entry] of memoryStore.entries()) {
    if (t - entry.createdAt > TTL_MS) memoryStore.delete(id);
  }
}

export function memoryStats() {
  let totalBytes = 0;
  for (const e of memoryStore.values()) totalBytes += e.bytes || 0;
  return { count: memoryStore.size, totalBytes };
}

export async function setCapture(id: string, entry: CaptureEntry) {
  if (!isRedisConfigured()) {
    memoryStore.set(id, entry);
    return;
  }

  const redis = getRedis();
  const ttlSeconds = Math.ceil(TTL_MS / 1000);
  await redis.set(keyFor(id), entry, { ex: ttlSeconds });
}

export async function getCapture(id: string): Promise<CaptureEntry | null> {
  if (!isRedisConfigured()) {
    return memoryStore.get(id) ?? null;
  }

  const redis = getRedis();
  const raw = await redis.get<CaptureEntry | string>(keyFor(id));
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as CaptureEntry;
    } catch {
      return null;
    }
  }
  return raw as CaptureEntry;
}

export async function deleteCapture(id: string) {
  if (!isRedisConfigured()) {
    memoryStore.delete(id);
    return;
  }

  const redis = getRedis();
  await redis.del(keyFor(id));
}
