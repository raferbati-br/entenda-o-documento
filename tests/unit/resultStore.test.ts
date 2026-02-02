/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { clearResult, loadResult, saveResult } from "@/lib/resultStore";


describe("resultStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("saves and loads result", () => {
    const payload = { confidence: 0.5, cards: [{ id: "1", title: "t", text: "x" }], notice: "n" };
    saveResult(payload);
    expect(loadResult()).toEqual(payload);
  });

  it("returns null for missing or invalid payload", () => {
    expect(loadResult()).toBeNull();
    sessionStorage.setItem("eod_result_v2", "{bad json");
    expect(loadResult()).toBeNull();
    sessionStorage.setItem("eod_result_v2", JSON.stringify({ confidence: "x" }));
    expect(loadResult()).toBeNull();
  });

  it("clears stored result", () => {
    const payload = { confidence: 0.2, cards: [], notice: "" };
    saveResult(payload);
    clearResult();
    expect(loadResult()).toBeNull();
  });

  it("no-ops when window is unavailable", () => {
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", undefined as unknown as Window);

    saveResult({ confidence: 0.1, cards: [], notice: "" });
    expect(loadResult()).toBeNull();
    clearResult();

    vi.stubGlobal("window", originalWindow);
  });
});
