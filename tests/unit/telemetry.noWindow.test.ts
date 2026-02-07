/** @jest-environment node */
const captureMock = jest.fn();

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    capture: (...args: unknown[]) => captureMock(...args),
  },
}));

import { telemetryCapture } from "@/lib/telemetry";

describe("telemetry (no window)", () => {
  const realEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...realEnv };
    captureMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...realEnv };
  });

  it("does nothing when window is missing even with key", () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "key";
    telemetryCapture("event", { a: 1 });
    expect(captureMock).not.toHaveBeenCalled();
  });
});
