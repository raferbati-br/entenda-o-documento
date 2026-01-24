import { describe, expect, it } from "vitest";
import { deleteCapture, memoryStats, setCapture } from "@/lib/captureStoreServer";

describe("captureStoreServer", () => {
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
});
