import { check } from "k6";
import { errorRate, getSessionToken, askQuestion } from "./helpers.js";

// LOAD-3 Q&A streaming
export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || "1m",
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.01"],
    app_errors: ["rate<0.01"],
  },
};

const question = __ENV.QUESTION || "Qual o assunto principal?";
const context = __ENV.CONTEXT || "Documento de teste para carga.";

export default function qaStreaming() {
  const token = getSessionToken();
  if (!token) return;
  const res = askQuestion(token, { question, context, attempt: 1 });
  check(res, { "qa ok": (r) => r.status === 200 || r.status === 502 });
  errorRate.add(!(res.status === 200 || res.status === 502));
}
