import { check } from "k6";
import { errorRate, getSessionToken, createCapture, analyzeCapture } from "./helpers.js";

// LOAD-8 Armazenamento em memoria (capturas)
export const options = {
  vus: Number(__ENV.VUS || 2),
  duration: __ENV.DURATION || "10m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    app_errors: ["rate<0.01"],
  },
};

export default function memoryLongRun() {
  const token = getSessionToken();
  if (!token) return;
  const captureId = createCapture(token);
  if (!captureId) return;
  const res = analyzeCapture(token, captureId);
  check(res, { "analyze ok": (r) => r.status === 200 || r.status === 502 });
  errorRate.add(!(res.status === 200 || res.status === 502));
}
