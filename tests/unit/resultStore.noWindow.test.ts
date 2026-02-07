/** @jest-environment node */
import { clearResult, loadResult, saveResult } from "@/lib/resultStore";

describe("resultStore (no window)", () => {
  it("no-ops when window is unavailable", () => {
    saveResult({ confidence: 0.1, cards: [], notice: "" });
    expect(loadResult()).toBeNull();
    clearResult();
  });
});
