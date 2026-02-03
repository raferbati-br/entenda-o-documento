import { check } from "k6";
import { errorRate, getSessionToken, createCapture, analyzeCapture } from "./helpers.js";

// LOAD-6 Stress de analise (picos)
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

export default function stressAnalyze() {
  const token = getSessionToken();
  if (!token) return;
  const captureId = createCapture(token);
  if (!captureId) return;
  const res = analyzeCapture(token, captureId);
  check(res, { "analyze ok": (r) => r.status === 200 || r.status === 502 });
  errorRate.add(!(res.status === 200 || res.status === 502));
}
