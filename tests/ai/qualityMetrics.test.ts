import { describe, expect, it } from "vitest";
import {
  getQualityMetrics,
  recordQualityCount,
  recordQualityLatency,
} from "@/lib/qualityMetrics";

describe("quality metrics", () => {
  it("records OCR and QA counters and latency", async () => {
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
});
