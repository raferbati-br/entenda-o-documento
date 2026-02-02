import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const redisIncrMock = vi.fn();
const redisExpireMock = vi.fn();

vi.mock("@upstash/redis", () => {
  class Redis {
    async incr(key: string) {
      return redisIncrMock(key);
    }
    async expire(key: string, ttl: number) {
      return redisExpireMock(key, ttl);
    }
  }
  return { Redis };
});

import { rateLimit } from "@/lib/rateLimit";

type RateLimitGlobal = typeof globalThis & {
  __RATE_LIMIT__?: Map<string, { count: number; resetAt: number }>;
};

const g = globalThis as RateLimitGlobal;


describe("rateLimit", () => {
  const realEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...realEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    g.__RATE_LIMIT__?.clear();
    vi.spyOn(Date, "now").mockReturnValue(120_000);
    redisIncrMock.mockReset();
    redisExpireMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...realEnv };
  });

  it("allows up to max per window in memory store", async () => {
    const first = await rateLimit("k");
    expect(first).toEqual({ ok: true, remaining: 4, resetSeconds: 60 });

    let last = first;
    for (let i = 0; i < 5; i += 1) {
      last = await rateLimit("k");
    }

    expect(last.ok).toBe(false);
    expect(last.remaining).toBe(0);
    expect(last.resetSeconds).toBe(60);
  });

  it("resets when window changes", async () => {
    const first = await rateLimit("k");
    expect(first.ok).toBe(true);

    (Date.now as unknown as { mockReturnValue: (value: number) => void }).mockReturnValue(180_000);
    const nextWindow = await rateLimit("k");
    expect(nextWindow).toEqual({ ok: true, remaining: 4, resetSeconds: 60 });
  });

  it("uses redis when configured", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    redisIncrMock.mockResolvedValueOnce(1).mockResolvedValueOnce(6);

    const first = await rateLimit("k");
    expect(first).toEqual({ ok: true, remaining: 4, resetSeconds: 60 });
    expect(redisExpireMock).toHaveBeenCalledTimes(1);

    const blocked = await rateLimit("k");
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(redisExpireMock).toHaveBeenCalledTimes(1);
  });

  it("returns ok when rate limit is disabled", async () => {
    process.env.RATE_LIMIT_DISABLED = "1";
    const out = await rateLimit("k");
    expect(out.ok).toBe(true);
    expect(out.remaining).toBe(Number.MAX_SAFE_INTEGER);
    delete process.env.RATE_LIMIT_DISABLED;
  });

  it("uses custom window and max per window", async () => {
    process.env.RATE_LIMIT_WINDOW_SECONDS = "10";
    process.env.RATE_LIMIT_MAX_PER_WINDOW = "2";

    const first = await rateLimit("custom");
    expect(first).toEqual({ ok: true, remaining: 1, resetSeconds: 10 });

    const second = await rateLimit("custom");
    expect(second.ok).toBe(true);

    const third = await rateLimit("custom");
    expect(third.ok).toBe(false);

    delete process.env.RATE_LIMIT_WINDOW_SECONDS;
    delete process.env.RATE_LIMIT_MAX_PER_WINDOW;
  });
});
