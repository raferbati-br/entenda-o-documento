/** @jest-environment node */
import {
  startLatencyTrace,
  markLatencyTrace,
  recordLatencyStep,
  getLatencyTraceSnapshot,
  clearLatencyTrace,
} from "@/lib/latencyTrace";

describe("latencyTrace (no window)", () => {
  it("no-ops when browser globals are missing", () => {
    startLatencyTrace();
    markLatencyTrace("y");
    recordLatencyStep("s", 1);
    expect(getLatencyTraceSnapshot()).toBeNull();
    clearLatencyTrace();
  });
});
