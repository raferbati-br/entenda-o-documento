import { useEffect, useRef, useCallback } from "react";
import { saveCapture } from "@/lib/captureStore";
import { telemetryCapture } from "@/lib/telemetry";

type TelemetryPayload = Record<string, string | number | boolean | null | undefined>;

type TelemetryEvent = {
  name: string;
  data?: TelemetryPayload;
};

type UseCaptureInputOptions = {
  onSaved?: () => void | Promise<void>;
  telemetry?: {
    openGallery?: TelemetryEvent;
    openCamera?: TelemetryEvent;
    selected?: TelemetryEvent;
  };
};

export function useCaptureInput(options: UseCaptureInputOptions = {}) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const onSavedRef = useRef(options.onSaved);
  const telemetryRef = useRef(options.telemetry);

  useEffect(() => {
    onSavedRef.current = options.onSaved;
    telemetryRef.current = options.telemetry;
  }, [options.onSaved, options.telemetry]);

  const track = useCallback((event?: TelemetryEvent) => {
    if (!event?.name) return;
    telemetryCapture(event.name, event.data);
  }, []);

  const openGallery = useCallback(() => {
    track(telemetryRef.current?.openGallery);
    galleryInputRef.current?.click();
  }, [track]);

  const openCamera = useCallback(() => {
    track(telemetryRef.current?.openCamera);
    cameraInputRef.current?.click();
  }, [track]);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      e.currentTarget.value = "";

      await saveCapture({
        blob: file,
        createdAt: new Date().toISOString(),
      });

      track(telemetryRef.current?.selected);
      await onSavedRef.current?.();
    },
    [track]
  );

  return {
    cameraInputRef,
    galleryInputRef,
    openGallery,
    openCamera,
    onFileChange,
  };
}
