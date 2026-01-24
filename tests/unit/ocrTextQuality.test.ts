import { describe, expect, it } from "vitest";
import { evaluateOcrText, isOcrTextSufficient } from "@/lib/ocrTextQuality";

describe("ocrTextQuality", () => {
  it("rejects empty or whitespace text", () => {
    expect(isOcrTextSufficient("")).toBe(false);
    expect(isOcrTextSufficient("   ")).toBe(false);
  });

  it("rejects text below minimum length", () => {
    const quality = evaluateOcrText("short text", { minChars: 20, minAlphaRatio: 0.2 });
    expect(quality.ok).toBe(false);
    expect(quality.length).toBeGreaterThan(0);
  });

  it("rejects text with low alpha ratio", () => {
    const quality = evaluateOcrText("1234 5678 9900 ----", { minChars: 10, minAlphaRatio: 0.5 });
    expect(quality.ok).toBe(false);
    expect(quality.alphaRatio).toBeLessThan(0.5);
  });

  it("accepts text with sufficient length and letters", () => {
    const text = "This is a sample OCR text with enough readable content to pass.";
    const quality = evaluateOcrText(text, { minChars: 20, minAlphaRatio: 0.2 });
    expect(quality.ok).toBe(true);
    expect(quality.alphaRatio).toBeGreaterThanOrEqual(0.2);
  });
});
