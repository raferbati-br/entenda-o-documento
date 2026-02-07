type RedisInstance = {
  incr: ReturnType<typeof jest.fn>;
  incrby: ReturnType<typeof jest.fn>;
  get: ReturnType<typeof jest.fn>;
};

const redisInstances: RedisInstance[] = [];
let redisGetMap = new Map<string, number>();

jest.mock("@upstash/redis", () => {
  const Redis = jest.fn(function Redis(this: RedisInstance) {
    this.incr = jest.fn();
    this.incrby = jest.fn();
    this.get = jest.fn((key: string) => redisGetMap.get(String(key)));
    redisInstances.push(this);
  });

  return {
    Redis,
  };
});

function setRedisEnv() {
  process.env.UPSTASH_REDIS_REST_URL = "https://example.com";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
}

function clearRedisEnv() {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

async function loadMetricsModule() {
  jest.resetModules();
  return await import("@/lib/qualityMetrics");
}

beforeEach(() => {
  redisInstances.length = 0;
  redisGetMap = new Map<string, number>();
  jest.clearAllMocks();
  clearRedisEnv();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("quality metrics", () => {
  it("records OCR and QA counters and latency in memory", async () => {
    const { getQualityMetrics, recordQualityCount, recordQualityLatency } =
      await loadMetricsModule();
    const now = new Date();
    const before = await getQualityMetrics(1);
    const base = before[0];

    const baseOcrInvalid = base.counts.ocr_invalid_json || 0;
    const baseOcrRetry = base.counts.ocr_retry || 0;
    const baseQaModelError = base.counts.qa_model_error || 0;
    const baseQaRetry = base.counts.qa_retry || 0;
    const baseLatencySum = base.latency.ocr_latency_ms?.sum || 0;
    const baseLatencyCount = base.latency.ocr_latency_ms?.count || 0;

    await recordQualityCount("ocr_invalid_json", 2, now);
    await recordQualityCount("ocr_retry", 1, now);
    await recordQualityCount("qa_model_error", 1, now);
    await recordQualityCount("qa_retry", 3, now);
    await recordQualityLatency("ocr_latency_ms", 120, now);
    await recordQualityLatency("ocr_latency_ms", 80, now);

    const after = await getQualityMetrics(1);
    const row = after[0];

    expect(row.counts.ocr_invalid_json).toBe(baseOcrInvalid + 2);
    expect(row.counts.ocr_retry).toBe(baseOcrRetry + 1);
    expect(row.counts.qa_model_error).toBe(baseQaModelError + 1);
    expect(row.counts.qa_retry).toBe(baseQaRetry + 3);
    expect(row.latency.ocr_latency_ms?.sum).toBe(baseLatencySum + 200);
    expect(row.latency.ocr_latency_ms?.count).toBe(baseLatencyCount + 2);
    expect(row.latency.ocr_latency_ms?.avg).toBe(
      Math.round((baseLatencySum + 200) / (baseLatencyCount + 2))
    );
  });

  it("creates a single Redis client and uses incr/incrby for counts", async () => {
    setRedisEnv();
    const { recordQualityCount } = await loadMetricsModule();
    const date = new Date("2026-01-20T10:00:00Z");
    const day = "2026-01-20";

    await recordQualityCount("analyze_total", 1, date);
    await recordQualityCount("qa_retry", 3, date);

    expect(redisInstances.length).toBe(1);
    const redis = redisInstances[0];
    expect(redis.incr).toHaveBeenCalledWith(`metrics:quality:${day}:analyze_total`);
    expect(redis.incrby).toHaveBeenCalledWith(`metrics:quality:${day}:qa_retry`, 3);
  });

  it("records latency via redis and computes averages from redis values", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-21T12:00:00Z"));
    setRedisEnv();
    const { recordQualityLatency, getQualityMetrics } = await loadMetricsModule();
    const date = new Date("2026-01-21T12:00:00Z");
    const day = "2026-01-21";

    await recordQualityLatency("ocr_latency_ms", 1, date);
    await recordQualityLatency("ocr_latency_ms", 50, date);

    const redis = redisInstances[0];
    const sumKey = `metrics:quality:${day}:ocr_latency_ms:sum`;
    const countKey = `metrics:quality:${day}:ocr_latency_ms:count`;
    expect(redis.incr).toHaveBeenCalledWith(sumKey);
    expect(redis.incrby).toHaveBeenCalledWith(sumKey, 50);
    expect(redis.incr).toHaveBeenCalledWith(countKey);

    redisGetMap.set(`metrics:quality:${day}:analyze_total`, 2);
    redisGetMap.set(`metrics:quality:${day}:analyze_invalid_json`, 0);
    redisGetMap.set(`metrics:quality:${day}:analyze_low_confidence`, 1);
    redisGetMap.set(`metrics:quality:${day}:analyze_sanitizer`, 0);
    redisGetMap.set(`metrics:quality:${day}:analyze_retry`, 3);
    redisGetMap.set(`metrics:quality:${day}:ocr_invalid_json`, 4);
    redisGetMap.set(`metrics:quality:${day}:ocr_retry`, 1);
    redisGetMap.set(`metrics:quality:${day}:qa_model_error`, 2);
    redisGetMap.set(`metrics:quality:${day}:qa_retry`, 5);
    redisGetMap.set(`metrics:quality:${day}:analyze_latency_ms:sum`, 0);
    redisGetMap.set(`metrics:quality:${day}:analyze_latency_ms:count`, 0);
    redisGetMap.set(`metrics:quality:${day}:ocr_latency_ms:sum`, 101);
    redisGetMap.set(`metrics:quality:${day}:ocr_latency_ms:count`, 2);
    redisGetMap.set(`metrics:quality:${day}:qa_latency_ms:sum`, 30);
    redisGetMap.set(`metrics:quality:${day}:qa_latency_ms:count`, 3);

    const rows = await getQualityMetrics(1);
    const row = rows[0];

    expect(row.counts.analyze_total).toBe(2);
    expect(row.counts.qa_retry).toBe(5);
    expect(row.latency.ocr_latency_ms?.sum).toBe(101);
    expect(row.latency.ocr_latency_ms?.count).toBe(2);
    expect(row.latency.ocr_latency_ms?.avg).toBe(51);
    expect(row.latency.analyze_latency_ms?.avg).toBe(0);
  });

  it("returns zeros when no metrics exist in memory", async () => {
    const { getQualityMetrics } = await loadMetricsModule();
    const rows = await getQualityMetrics(1);
    const row = rows[0];

    expect(row.counts.analyze_total).toBe(0);
    expect(row.latency.qa_latency_ms?.sum).toBe(0);
    expect(row.latency.qa_latency_ms?.count).toBe(0);
    expect(row.latency.qa_latency_ms?.avg).toBe(0);
  });
});
