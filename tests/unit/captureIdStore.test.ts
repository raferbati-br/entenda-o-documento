/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from "vitest";
import { clearCaptureId, loadCaptureId, saveCaptureId } from "@/lib/captureIdStore";


describe("captureIdStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("saves and loads capture id", () => {
    saveCaptureId("abc");
    expect(loadCaptureId()).toBe("abc");
  });

  it("clears capture id", () => {
    saveCaptureId("abc");
    clearCaptureId();
    expect(loadCaptureId()).toBeNull();
  });
});
