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

  it("uses env defaults with fallback and clamps ratio", () => {
    const originalMinChars = process.env.ANALYZE_OCR_MIN_CHARS;
    const originalMinRatio = process.env.ANALYZE_OCR_MIN_ALPHA_RATIO;
    process.env.ANALYZE_OCR_MIN_CHARS = "-1";
    process.env.ANALYZE_OCR_MIN_ALPHA_RATIO = "1.5";

    const quality = evaluateOcrText("texto com letras suficientes", undefined);
    expect(quality.minChars).toBe(200);
    expect(quality.minAlphaRatio).toBe(1);

    process.env.ANALYZE_OCR_MIN_CHARS = "10.8";
    process.env.ANALYZE_OCR_MIN_ALPHA_RATIO = "-0.2";
    const quality2 = evaluateOcrText("abc", undefined);
    expect(quality2.minChars).toBe(10);
    expect(quality2.minAlphaRatio).toBe(0);

    process.env.ANALYZE_OCR_MIN_CHARS = originalMinChars;
    process.env.ANALYZE_OCR_MIN_ALPHA_RATIO = originalMinRatio;
  });
});
