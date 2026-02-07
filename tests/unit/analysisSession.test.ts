import { resetAnalysisSession } from "@/lib/analysisSession";

jest.mock("@/lib/resultStore", () => ({
  clearResult: jest.fn(),
}));

jest.mock("@/lib/qaContextStore", () => ({
  clearQaContext: jest.fn(),
}));

jest.mock("@/lib/captureIdStore", () => ({
  clearCaptureId: jest.fn(),
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
