/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const captureMock = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    capture: (...args: unknown[]) => captureMock(...args),
  },
}));

import { telemetryCapture } from "@/lib/telemetry";


describe("telemetry", () => {
  const realEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...realEnv };
    captureMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...realEnv };
  });

  it("does nothing when not enabled", () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    telemetryCapture("event");
    expect(captureMock).not.toHaveBeenCalled();
  });

  it("captures when enabled", () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "key";
    telemetryCapture("event", { a: 1 });
    expect(captureMock).toHaveBeenCalledWith("event", { a: 1 });
  });
});
