import { check } from "k6";
import { errorRate, getSessionToken, createCapture, ocrCapture } from "./helpers.js";

// LOAD-2 OCR dedicado
export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || "1m",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
    app_errors: ["rate<0.01"],
  },
};

export function setup() {
  const token = getSessionToken();
  if (!token) return null;
  const captureId = createCapture(token);
  if (!captureId) return null;
  return { token, captureId };
}

export default function ocrBaseline(data) {
  if (!data?.token || !data?.captureId) return;
  const res = ocrCapture(data.token, data.captureId);
  check(res, { "ocr ok": (r) => r.status === 200 || r.status === 502 });
  errorRate.add(!(res.status === 200 || res.status === 502));
}
