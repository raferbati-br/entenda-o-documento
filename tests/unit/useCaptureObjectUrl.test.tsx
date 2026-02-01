/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import type { ReactElement } from "react";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { useCaptureObjectUrl } from "@/lib/hooks/useCaptureObjectUrl";

const mockLoadCapture = vi.fn();
vi.mock("@/lib/captureStore", () => ({
  loadCapture: (...args: unknown[]) => mockLoadCapture(...args),
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useCaptureObjectUrl", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    mockLoadCapture.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("sets error and calls onMissing when capture is missing", async () => {
    mockLoadCapture.mockResolvedValue(null);
    const onMissing = vi.fn();
    let snapshot: { url: string | null; error: string | null } = { url: null, error: null };

    function Harness() {
      const state = useCaptureObjectUrl({ onMissing, missingMessage: "missing" });
      useEffect(() => {
        snapshot = state;
      }, [state]);
      return null;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
      await flushPromises();
    });

    expect(snapshot.url).toBeNull();
    expect(snapshot.error).toBe("missing");
    expect(onMissing).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("creates and revokes object URL when capture exists", async () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    mockLoadCapture.mockResolvedValue({ blob, createdAt: "2024-01-01T00:00:00.000Z" });
    let snapshot: { url: string | null; error: string | null } = { url: null, error: null };

    function Harness() {
      const state = useCaptureObjectUrl();
      useEffect(() => {
        snapshot = state;
      }, [state]);
      return null;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<Harness />);
      await flushPromises();
    });

    expect(snapshot.url).toBe("blob:mock-url");
    expect(snapshot.error).toBeNull();
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);

    await act(async () => {
      root.unmount();
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});
