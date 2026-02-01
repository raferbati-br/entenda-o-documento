/**
 * Armazenamento de capturas no servidor usando Redis ou memória global.
 * Gerencia imagens e dados OCR com TTL para limpeza automática.
 */

import { Redis } from "@upstash/redis";

export type CaptureEntry = {
  imageBase64: string; // DataURL da imagem
  mimeType: string; // Tipo MIME
  createdAt: number; // Timestamp de criação
  bytes: number; // Tamanho em bytes
  ocrImageBase64?: string; // DataURL da imagem OCR
  ocrBytes?: number; // Tamanho da imagem OCR
};

const TTL_MS = 10 * 60 * 1000; // 10 minutos

type CaptureStoreGlobal = typeof globalThis & {
  __CAPTURE_STORE__?: Map<string, CaptureEntry>;
};

const g = globalThis as CaptureStoreGlobal;
g.__CAPTURE_STORE__ ??= new Map<string, CaptureEntry>();
const memoryStore: Map<string, CaptureEntry> = g.__CAPTURE_STORE__;

let redisClient: Redis | null = null;

// Verifica se Redis está configurado
export function isRedisConfigured() {
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

// Gera chave para o ID
function keyFor(id: string) {
  return `capture:${id}`;
}

// Limpa entradas expiradas na memória (se não usar Redis)
export function cleanupMemoryStore() {
  if (isRedisConfigured()) return;
  const t = Date.now();
  for (const [id, entry] of memoryStore.entries()) {
    if (t - entry.createdAt > TTL_MS) memoryStore.delete(id);
  }
}

// Estatísticas da memória
export function memoryStats() {
  let totalBytes = 0;
  for (const e of memoryStore.values()) totalBytes += (e.bytes || 0) + (e.ocrBytes || 0);
  return { count: memoryStore.size, totalBytes };
}

// Salva captura no Redis ou memória
export async function setCapture(id: string, entry: CaptureEntry) {
  if (!isRedisConfigured()) {
    memoryStore.set(id, entry);
    return;
  }

  const redis = getRedis();
  const ttlSeconds = Math.ceil(TTL_MS / 1000);
  await redis.set(keyFor(id), entry, { ex: ttlSeconds });
}

// Carrega captura do Redis ou memória
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
  return raw;
}

// Deleta captura do Redis ou memória
export async function deleteCapture(id: string) {
  if (!isRedisConfigured()) {
    memoryStore.delete(id);
    return;
  }

  const redis = getRedis();
  await redis.del(keyFor(id));
}
