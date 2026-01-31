import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

type RedisSetCall = { key: string; value: unknown; opts?: { ex: number } };

const redisSetCalls: RedisSetCall[] = [];
const redisDelCalls: string[] = [];
let redisGetValue: unknown = null;

vi.mock("@upstash/redis", () => {
  class Redis {
    async set(key: string, value: unknown, opts?: { ex: number }) {
      redisSetCalls.push({ key, value, opts });
      return "OK";
    }
    async get() {
      return redisGetValue as unknown;
    }
    async del(key: string) {
      redisDelCalls.push(key);
      return 1;
    }
  }
  return { Redis };
});

describe("captureStoreServer (redis)", () => {
  beforeEach(() => {
    redisSetCalls.length = 0;
    redisDelCalls.length = 0;
    redisGetValue = null;
    process.env.UPSTASH_REDIS_REST_URL = "https://example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("uses redis when configured", async () => {
    const mod = await import("@/lib/captureStoreServer");
    const entry = { imageBase64: "data", mimeType: "image/png", createdAt: 1, bytes: 10 };
    await mod.setCapture("id1", entry);

    expect(redisSetCalls.length).toBe(1);
    expect(redisSetCalls[0].key).toBe("capture:id1");
    expect(redisSetCalls[0].value).toEqual(entry);
    expect(redisSetCalls[0].opts?.ex).toBeGreaterThan(0);
  });

  it("parses json string from redis", async () => {
    const mod = await import("@/lib/captureStoreServer");
    redisGetValue = JSON.stringify({ imageBase64: "x", mimeType: "image/png", createdAt: 1, bytes: 1 });

    const out = await mod.getCapture("id2");

    expect(out?.imageBase64).toBe("x");
  });

  it("returns null for invalid json in redis", async () => {
    const mod = await import("@/lib/captureStoreServer");
    redisGetValue = "{bad json";

    const out = await mod.getCapture("id3");

    expect(out).toBeNull();
  });

  it("deletes from redis", async () => {
    const mod = await import("@/lib/captureStoreServer");
    await mod.deleteCapture("id4");

    expect(redisDelCalls).toEqual(["capture:id4"]);
  });
});
