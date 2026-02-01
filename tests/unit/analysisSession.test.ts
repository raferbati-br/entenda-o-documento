import { describe, expect, it, vi } from "vitest";
import { resetAnalysisSession } from "@/lib/analysisSession";

vi.mock("@/lib/resultStore", () => ({
  clearResult: vi.fn(),
}));

vi.mock("@/lib/qaContextStore", () => ({
  clearQaContext: vi.fn(),
}));

vi.mock("@/lib/captureIdStore", () => ({
  clearCaptureId: vi.fn(),
}));

describe("analysisSession", () => {
  it("clears result, qa context, and capture id", async () => {
    const { clearResult } = await import("@/lib/resultStore");
    const { clearQaContext } = await import("@/lib/qaContextStore");
    const { clearCaptureId } = await import("@/lib/captureIdStore");

    resetAnalysisSession();

    expect(clearResult).toHaveBeenCalledTimes(1);
    expect(clearQaContext).toHaveBeenCalledTimes(1);
    expect(clearCaptureId).toHaveBeenCalledTimes(1);
  });
});
