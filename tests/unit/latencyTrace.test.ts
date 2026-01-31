/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from "vitest";
import {
  startLatencyTrace,
  markLatencyTrace,
  recordLatencyStep,
  getLatencyTraceSnapshot,
  clearLatencyTrace,
} from "@/lib/latencyTrace";

function readRaw() {
  return sessionStorage.getItem("eod_latency_trace_v1");
}

describe("latencyTrace", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("records start, marks, and steps", () => {
    startLatencyTrace();
    markLatencyTrace("a");
    recordLatencyStep("step1", 12.6);

    const snap = getLatencyTraceSnapshot(Date.now() + 5);
    expect(snap).not.toBeNull();
    expect(snap?.steps.step1).toBe(13);
    expect(snap?.marks.a).toBeTypeOf("number");
    expect(readRaw()).toBeTypeOf("string");
  });

  it("ignores invalid inputs", () => {
    startLatencyTrace();
    markLatencyTrace("");
    recordLatencyStep("bad", Number.NaN);

    const snap = getLatencyTraceSnapshot();
    expect(snap?.steps.bad).toBeUndefined();
  });

  it("clears trace", () => {
    startLatencyTrace();
    expect(readRaw()).not.toBeNull();
    clearLatencyTrace();
    expect(readRaw()).toBeNull();
  });
});
