import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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
});
