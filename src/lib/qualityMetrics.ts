import { Redis } from "@upstash/redis";

type MetricName =
  | "analyze_total"
  | "analyze_invalid_json"
  | "analyze_low_confidence"
  | "analyze_sanitizer"
  | "analyze_retry"
  | "analyze_text_only"
  | "analyze_image_fallback"
  | "ocr_invalid_json"
  | "ocr_retry"
  | "qa_model_error"
  | "qa_retry";

type LatencyMetricName = "analyze_latency_ms" | "ocr_latency_ms" | "qa_latency_ms";

const COUNT_METRICS: MetricName[] = [
  "analyze_total",
  "analyze_invalid_json",
  "analyze_low_confidence",
  "analyze_sanitizer",
  "analyze_retry",
  "analyze_text_only",
  "analyze_image_fallback",
  "ocr_invalid_json",
  "ocr_retry",
  "qa_model_error",
  "qa_retry",
];

const LATENCY_METRICS: LatencyMetricName[] = [
  "analyze_latency_ms",
  "ocr_latency_ms",
  "qa_latency_ms",
];

const memoryStore = new Map<string, number>();
let redisClient: Redis | null = null;

function getRedis() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!redisClient) {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    return redisClient;
  }
  return null;
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function metricKey(day: string, name: string) {
  return `metrics:quality:${day}:${name}`;
}

function incrementMemory(key: string, inc = 1) {
  const current = memoryStore.get(key) || 0;
  memoryStore.set(key, current + inc);
}

async function incrementRedis(redis: Redis, key: string, inc = 1) {
  if (inc === 1) {
    await redis.incr(key);
  } else {
    await redis.incrby(key, inc);
  }
}

export async function recordQualityCount(name: MetricName, inc = 1, date = new Date()) {
  const day = dayKey(date);
  const key = metricKey(day, name);
  const redis = getRedis();
  if (!redis) {
    incrementMemory(key, inc);
    return;
  }
  await incrementRedis(redis, key, inc);
}

export async function recordQualityLatency(name: LatencyMetricName, ms: number, date = new Date()) {
  const day = dayKey(date);
  const redis = getRedis();
  const sumKey = metricKey(day, `${name}:sum`);
  const countKey = metricKey(day, `${name}:count`);
  if (!redis) {
    incrementMemory(sumKey, ms);
    incrementMemory(countKey, 1);
    return;
  }
  await Promise.all([incrementRedis(redis, sumKey, ms), incrementRedis(redis, countKey, 1)]);
}

export async function getQualityMetrics(days = 7) {
  const now = new Date();
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(dayKey(d));
  }

  const redis = getRedis();
  const result = [];

  for (const day of dates) {
    const counts: Record<string, number> = {};
    const latency: Record<string, { avg: number; sum: number; count: number }> = {};

    if (!redis) {
      for (const name of COUNT_METRICS) {
        counts[name] = memoryStore.get(metricKey(day, name)) || 0;
      }
      for (const name of LATENCY_METRICS) {
        const sum = memoryStore.get(metricKey(day, `${name}:sum`)) || 0;
        const count = memoryStore.get(metricKey(day, `${name}:count`)) || 0;
        latency[name] = {
          sum,
          count,
          avg: count ? Math.round(sum / count) : 0,
        };
      }
      result.push({ day, counts, latency });
      continue;
    }

    const countKeys = COUNT_METRICS.map((name) => metricKey(day, name));
    const countValues = await Promise.all(countKeys.map((key) => redis.get<number>(key)));
    COUNT_METRICS.forEach((name, idx) => {
      counts[name] = Number(countValues[idx] || 0);
    });

    for (const name of LATENCY_METRICS) {
      const sumKey = metricKey(day, `${name}:sum`);
      const countKey = metricKey(day, `${name}:count`);
      const [sumValue, countValue] = await Promise.all([
        redis.get<number>(sumKey),
        redis.get<number>(countKey),
      ]);
      const sum = Number(sumValue || 0);
      const count = Number(countValue || 0);
      latency[name] = {
        sum,
        count,
        avg: count ? Math.round(sum / count) : 0,
      };
    }

    result.push({ day, counts, latency });
  }

  return result;
}
