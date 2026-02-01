/**
 * Utilitários de telemetria usando PostHog.
 * Registra eventos para análise de uso.
 */

import posthog from "posthog-js";

type TelemetryProps = Record<string, string | number | boolean | null | undefined>;

// Verifica se telemetria está habilitada
function isEnabled() {
  return globalThis.window !== undefined && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

// Captura evento de telemetria
export function telemetryCapture(event: string, properties?: TelemetryProps) {
  if (!isEnabled()) return;
  posthog.capture(event, properties || {});
}
