import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

type RedisSetCall = { key: string; value: unknown; opts?: { ex: number } };

const redisSetCalls: RedisSetCall[] = [];
const redisDelCalls: string[] = [];
let redisGetValue: unknown = null;
let redisSetError: Error | null = null;
let redisGetError: Error | null = null;
let redisDelError: Error | null = null;

vi.mock("@upstash/redis", () => {
  class Redis {
    async set(key: string, value: unknown, opts?: { ex: number }) {
      if (redisSetError) throw redisSetError;
      redisSetCalls.push({ key, value, opts });
      return "OK";
    }
    async get() {
      if (redisGetError) throw redisGetError;
      return redisGetValue;
    }
    async del(key: string) {
      if (redisDelError) throw redisDelError;
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
    redisSetError = null;
    redisGetError = null;
    redisDelError = null;
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

  it("returns object payload from redis directly", async () => {
    const mod = await import("@/lib/captureStoreServer");
    redisGetValue = { imageBase64: "y", mimeType: "image/png", createdAt: 1, bytes: 2 };

    const out = await mod.getCapture("id2b");

    expect(out?.imageBase64).toBe("y");
  });

  it("returns null for invalid json in redis", async () => {
    const mod = await import("@/lib/captureStoreServer");
    redisGetValue = "{bad json";

    const out = await mod.getCapture("id3");

    expect(out).toBeNull();
  });

  it("returns null when redis has no value", async () => {
    const mod = await import("@/lib/captureStoreServer");
    redisGetValue = null;

    const out = await mod.getCapture("id3b");

    expect(out).toBeNull();
  });

  it("deletes from redis", async () => {
    const mod = await import("@/lib/captureStoreServer");
    await mod.deleteCapture("id4");

    expect(redisDelCalls).toEqual(["capture:id4"]);
  });

  it("falls back to memory when redis set fails", async () => {
    const mod = await import("@/lib/captureStoreServer");
    const entry = { imageBase64: "data", mimeType: "image/png", createdAt: Date.now(), bytes: 10 };
    redisSetError = new Error("boom");

    await mod.setCapture("id-fallback", entry);

    const out = await mod.getCapture("id-fallback");
    expect(out).toEqual(entry);
  });

  it("clears memory when redis delete fails", async () => {
    const mod = await import("@/lib/captureStoreServer");
    const entry = { imageBase64: "data", mimeType: "image/png", createdAt: Date.now(), bytes: 10 };
    redisSetError = new Error("boom");
    await mod.setCapture("id-del-fallback", entry);
    redisSetError = null;
    redisDelError = new Error("boom-del");

    await mod.deleteCapture("id-del-fallback");
    const out = await mod.getCapture("id-del-fallback");
    expect(out).toBeNull();
  });
});
