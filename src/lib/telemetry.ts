import posthog from "posthog-js";

type TelemetryProps = Record<string, string | number | boolean | null | undefined>;

function isEnabled() {
  return typeof globalThis.window !== "undefined" && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function telemetryCapture(event: string, properties?: TelemetryProps) {
  if (!isEnabled()) return;
  posthog.capture(event, properties || {});
}
