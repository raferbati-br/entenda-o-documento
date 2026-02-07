/** @jest-environment jsdom */
import { stubGlobal, unstubAllGlobals } from "./jestGlobals";
const captureMock = jest.fn();

jest.mock("posthog-js", () => ({
  __esModule: true,
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
    unstubAllGlobals();
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

  it("passes empty properties when none provided", () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "key";
    telemetryCapture("event");
    expect(captureMock).toHaveBeenCalledWith("event", {});
  });

  it("does nothing when window is missing even with key", () => {
    stubGlobal("window", undefined as unknown as Window);
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "key";
    telemetryCapture("event", { a: 1 });
    expect(captureMock).not.toHaveBeenCalled();
  });
});
