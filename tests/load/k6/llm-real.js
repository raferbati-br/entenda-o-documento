import { check } from "k6";
import { errorRate, getSessionToken, createCapture, analyzeCapture } from "./helpers.js";

// LOAD-9 Provedor real (LLM)
export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || "1m",
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    http_req_failed: ["rate<0.02"],
    app_errors: ["rate<0.02"],
  },
};

export default function llmRealBaseline() {
  const token = getSessionToken();
  if (!token) return;
  const captureId = createCapture(token);
  if (!captureId) return;
  const res = analyzeCapture(token, captureId);
  check(res, { "analyze ok": (r) => r.status === 200 || r.status === 502 });
  errorRate.add(!(res.status === 200 || res.status === 502));
}
