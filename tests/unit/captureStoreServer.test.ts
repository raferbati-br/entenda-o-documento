import { deleteCapture, memoryStats, setCapture, getCapture, cleanupMemoryStore } from "@/lib/captureStoreServer";

describe("captureStoreServer", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("includes ocrBytes in memoryStats totals", async () => {
    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = "";
    process.env.UPSTASH_REDIS_REST_TOKEN = "";

    const base = memoryStats();
    const id = "test-capture-ocr-bytes";
    try {
      await setCapture(id, {
        imageBase64: "data:image/jpeg;base64,AA",
        mimeType: "image/jpeg",
        createdAt: Date.now(),
        bytes: 120,
        ocrImageBase64: "data:image/jpeg;base64,BB",
        ocrBytes: 40,
      });

      const next = memoryStats();
      expect(next.count).toBe(base.count + 1);
      expect(next.totalBytes).toBe(base.totalBytes + 160);
    } finally {
      await deleteCapture(id);
      if (prevUrl === undefined) {
        delete process.env.UPSTASH_REDIS_REST_URL;
      } else {
        process.env.UPSTASH_REDIS_REST_URL = prevUrl;
      }
      if (prevToken === undefined) {
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
      } else {
        process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
      }
    }
  });

  it("loads and cleans expired entries in memory store", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    await setCapture("mem-1", {
      imageBase64: "data:image/jpeg;base64,AA",
      mimeType: "image/jpeg",
      createdAt: Date.now() - 20 * 60 * 1000,
      bytes: 10,
    });

    expect(await getCapture("mem-1")).not.toBeNull();
    cleanupMemoryStore();
    expect(await getCapture("mem-1")).toBeNull();
    nowSpy.mockRestore();
  });

  it("keeps non-expired entries during cleanup", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    await setCapture("mem-2", {
      imageBase64: "data:image/jpeg;base64,AA",
      mimeType: "image/jpeg",
      createdAt: Date.now() - 1 * 60 * 1000,
      bytes: 10,
    });

    cleanupMemoryStore();
    expect(await getCapture("mem-2")).not.toBeNull();
    await deleteCapture("mem-2");
    nowSpy.mockRestore();
  });

  it("handles missing byte fields in memoryStats", async () => {
    const base = memoryStats();
    await setCapture("mem-3", {
      imageBase64: "data:image/jpeg;base64,AA",
      mimeType: "image/jpeg",
      createdAt: Date.now(),
      bytes: 0,
      ocrBytes: 0,
    });

    const next = memoryStats();
    expect(next.count).toBe(base.count + 1);
    expect(next.totalBytes).toBe(base.totalBytes);
    await deleteCapture("mem-3");
  });

  it("skips cleanup when redis is configured", async () => {
    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const id = "mem-redis-skip";
    const base = memoryStats();

    await setCapture(id, {
      imageBase64: "data:image/jpeg;base64,AA",
      mimeType: "image/jpeg",
      createdAt: Date.now() - 20 * 60 * 1000,
      bytes: 10,
    });

    process.env.UPSTASH_REDIS_REST_URL = "https://example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    cleanupMemoryStore();
    expect(memoryStats().count).toBe(base.count + 1);

    if (prevUrl === undefined) {
      delete process.env.UPSTASH_REDIS_REST_URL;
    } else {
      process.env.UPSTASH_REDIS_REST_URL = prevUrl;
    }
    if (prevToken === undefined) {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    } else {
      process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
    }
    await deleteCapture(id);
  });
});
