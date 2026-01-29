import { useEffect, useRef, useState } from "react";
import { loadCapture } from "@/lib/captureStore";

type Options = {
  onMissing?: () => void;
  missingMessage?: string;
};

export function useCaptureObjectUrl(options: Options = {}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onMissingRef = useRef(options.onMissing);
  const missingMessageRef = useRef(options.missingMessage);

  useEffect(() => {
    onMissingRef.current = options.onMissing;
    missingMessageRef.current = options.missingMessage;
  }, [options.onMissing, options.missingMessage]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      const payload = await loadCapture();
      if (cancelled) return;
      if (!payload?.blob) {
        const message = missingMessageRef.current;
        if (message) setError(message);
        onMissingRef.current?.();
        return;
      }
      objectUrl = URL.createObjectURL(payload.blob);
      setUrl(objectUrl);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return { url, error };
}
