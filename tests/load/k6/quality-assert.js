import { check } from "k6";
import { errorRate, getSessionToken, createCapture, analyzeCapture } from "./helpers.js";

// LOAD-10 Qualidade do resultado (amostra valida)
export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || "1m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    app_errors: ["rate<0.01"],
  },
};

const keywords = (__ENV.KEYWORDS || "Documento,simulado")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

function extractText(result) {
  if (!result || !Array.isArray(result.cards)) return "";
  return result.cards.map((card) => String(card.text || "")).join(" ");
}

export default function qualityAssert() {
  const token = getSessionToken();
  if (!token) return;
  const captureId = createCapture(token);
  if (!captureId) return;
  const res = analyzeCapture(token, captureId);
  if (res.status !== 200) {
    errorRate.add(true);
    return;
  }

  const body = res.json();
  const text = extractText(body?.result || {});
  const hasKeyword = keywords.length === 0 || keywords.some((k) => text.includes(k));
  check(hasKeyword, { "quality keywords": (v) => v === true });
  errorRate.add(!hasKeyword);
}
