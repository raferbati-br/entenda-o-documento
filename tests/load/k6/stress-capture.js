import { check } from "k6";
import { errorRate, getSessionToken, createCapture } from "./helpers.js";

// LOAD-5 Stress de captura (picos)
const minVus = Number(__ENV.MIN_VUS || 10);
const maxVus = Number(__ENV.MAX_VUS || 50);

export const options = {
  stages: [
    { duration: __ENV.RAMP_UP || "30s", target: minVus },
    { duration: __ENV.PEAK || "2m", target: maxVus },
    { duration: __ENV.RAMP_DOWN || "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<4000"],
    http_req_failed: ["rate<0.02"],
    app_errors: ["rate<0.02"],
  },
};

export default function stressCapture() {
  const token = getSessionToken();
  if (!token) return;
  const captureId = createCapture(token);
  check(captureId, { "capture id": (id) => Boolean(id) });
  errorRate.add(!captureId);
}
