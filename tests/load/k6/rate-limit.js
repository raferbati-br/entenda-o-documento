import { check } from "k6";
import { Rate } from "k6/metrics";
import { errorRate, getSessionToken, createCapture, analyzeCapture } from "./helpers.js";

// LOAD-7 Redis (rate limit)
const minVus = Number(__ENV.MIN_VUS || 10);
const maxVus = Number(__ENV.MAX_VUS || 50);

const rateLimited = new Rate("rate_limited");

export const options = {
  stages: [
    { duration: __ENV.RAMP_UP || "20s", target: minVus },
    { duration: __ENV.BURST || "2m", target: maxVus },
    { duration: __ENV.RAMP_DOWN || "20s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<4000"],
    http_req_failed: ["rate<0.02"],
    app_errors: ["rate<0.02"],
  },
};

export default function rateLimitBurst() {
  const token = getSessionToken();
  if (!token) return;
  const captureId = createCapture(token);
  if (!captureId) return;
  const res = analyzeCapture(token, captureId);
  const isRateLimited = res.status === 429;
  rateLimited.add(isRateLimited);
  check(res, { "analyze ok or limited": (r) => r.status === 200 || r.status === 429 || r.status === 502 });
  errorRate.add(!(res.status === 200 || res.status === 429 || res.status === 502));
}
