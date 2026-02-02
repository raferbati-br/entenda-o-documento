/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach, vi } from "vitest";
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

  it("handles invalid stored json and missing startMs", () => {
    sessionStorage.setItem("eod_latency_trace_v1", "{bad json");
    expect(getLatencyTraceSnapshot()).toBeNull();

    sessionStorage.setItem(
      "eod_latency_trace_v1",
      JSON.stringify({ steps: { a: "x" }, marks: { b: 1 } })
    );
    const snap = getLatencyTraceSnapshot();
    expect(snap).toBeNull();
  });

  it("returns null when no trace is stored", () => {
    sessionStorage.removeItem("eod_latency_trace_v1");
    expect(getLatencyTraceSnapshot()).toBeNull();
  });

  it("loads empty trace when storage is empty", () => {
    sessionStorage.removeItem("eod_latency_trace_v1");
    markLatencyTrace("x");
    const snap = getLatencyTraceSnapshot();
    expect(snap).toBeNull();
  });

  it("handles non-record traces and missing browser globals", () => {
    sessionStorage.setItem("eod_latency_trace_v1", JSON.stringify(["bad"]));
    markLatencyTrace("x");
    expect(getLatencyTraceSnapshot()).toBeNull();

    const originalWindow = globalThis.window;
    const originalSession = globalThis.sessionStorage;
    vi.stubGlobal("window", undefined as unknown as Window);
    vi.stubGlobal("sessionStorage", undefined as unknown as Storage);

    startLatencyTrace();
    markLatencyTrace("y");
    recordLatencyStep("s", 1);
    expect(getLatencyTraceSnapshot()).toBeNull();
    clearLatencyTrace();

    vi.stubGlobal("window", originalWindow);
    vi.stubGlobal("sessionStorage", originalSession);
  });
});
