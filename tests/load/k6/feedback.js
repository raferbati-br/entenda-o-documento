import { check } from "k6";
import { errorRate, getSessionToken, sendFeedback } from "./helpers.js";

// LOAD-4 Feedback
export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || "1m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    app_errors: ["rate<0.01"],
  },
};

export default function feedbackBaseline() {
  const token = getSessionToken();
  if (!token) return;
  const res = sendFeedback(token, {
    helpful: true,
    reason: "",
    confidenceBucket: "high",
    contextSource: "load",
  });
  check(res, { "feedback ok": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
}
