/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { useCaptureInput } from "@/lib/hooks/useCaptureInput";

const mockSaveCapture = vi.fn();
vi.mock("@/lib/captureStore", () => ({
  saveCapture: (...args: unknown[]) => mockSaveCapture(...args),
}));

const mockTelemetry = vi.fn();
vi.mock("@/lib/telemetry", () => ({
  telemetryCapture: (...args: unknown[]) => mockTelemetry(...args),
}));

type HookApi = ReturnType<typeof useCaptureInput>;

function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("useCaptureInput", () => {
  beforeEach(() => {
    mockSaveCapture.mockReset();
    mockTelemetry.mockReset();
  });

  it("opens gallery and camera inputs with telemetry", () => {
    let api: HookApi | null = null;
    const telemetry = {
      openGallery: { name: "gallery_open", data: { source: "cta" } },
      openCamera: { name: "camera_open", data: { source: "cta" } },
    };

    function Harness() {
      const hook = useCaptureInput({ telemetry });
      useEffect(() => {
        api = hook;
      }, [hook]);
      return null;
    }

    render(<Harness />);

    const galleryInput = document.createElement("input");
    const cameraInput = document.createElement("input");
    const galleryClick = vi.spyOn(galleryInput, "click");
    const cameraClick = vi.spyOn(cameraInput, "click");

    expect(api).not.toBeNull();
    act(() => {
      api!.galleryInputRef.current = galleryInput;
      api!.cameraInputRef.current = cameraInput;
      api!.openGallery();
      api!.openCamera();
    });

    expect(galleryClick).toHaveBeenCalledTimes(1);
    expect(cameraClick).toHaveBeenCalledTimes(1);
    expect(mockTelemetry).toHaveBeenCalledWith("gallery_open", { source: "cta" });
    expect(mockTelemetry).toHaveBeenCalledWith("camera_open", { source: "cta" });
  });

  it("saves selected file, tracks telemetry, and calls onSaved", async () => {
    const onSaved = vi.fn();
    const telemetry = {
      selected: { name: "capture_selected", data: { flow: "camera" } },
    };
    let api: HookApi | null = null;

    function Harness() {
      const hook = useCaptureInput({ onSaved, telemetry });
      useEffect(() => {
        api = hook;
      }, [hook]);
      return null;
    }

    render(<Harness />);

    const input = document.createElement("input");
    input.value = "fake-path";
    const file = new File(["hello"], "test.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file] });

    const event = {
      target: input,
      currentTarget: input,
    } as React.ChangeEvent<HTMLInputElement>;

    mockSaveCapture.mockResolvedValue(undefined);

    await act(async () => {
      await api!.onFileChange(event);
    });

    expect(mockSaveCapture).toHaveBeenCalledTimes(1);
    expect(mockTelemetry).toHaveBeenCalledWith("capture_selected", { flow: "camera" });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(input.value).toBe("");
  });

  it("ignores missing file and telemetry", async () => {
    let api: HookApi | null = null;

    function Harness() {
      const hook = useCaptureInput();
      useEffect(() => {
        api = hook;
      }, [hook]);
      return null;
    }

    render(<Harness />);

    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [] });
    const event = {
      target: input,
      currentTarget: input,
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await api!.onFileChange(event);
      api!.openGallery();
    });

    expect(mockSaveCapture).not.toHaveBeenCalled();
    expect(mockTelemetry).not.toHaveBeenCalled();
  });
});
