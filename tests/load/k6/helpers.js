import http from "k6/http";
import { check } from "k6";
import { Rate } from "k6/metrics";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const errorRate = new Rate("app_errors");

const tinyPngBase64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

export function getSessionToken() {
  const res = http.get(`${BASE_URL}/api/session-token`, {
    headers: { Origin: BASE_URL },
  });
  check(res, { "session token ok": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  const token = res.json()?.token || "";
  return token;
}

export function createCapture(token) {
  const res = http.post(
    `${BASE_URL}/api/capture`,
    JSON.stringify({ imageBase64: tinyPngBase64 }),
    {
      headers: {
        "Content-Type": "application/json",
        "x-session-token": token,
        Origin: BASE_URL,
      },
    }
  );
  check(res, { "capture ok": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  const captureId = res.json()?.captureId || "";
  return captureId;
}

export function analyzeCapture(token, captureId, extraBody = {}) {
  const res = http.post(
    `${BASE_URL}/api/analyze`,
    JSON.stringify({ captureId, ...extraBody }),
    {
      headers: {
        "Content-Type": "application/json",
        "x-session-token": token,
        Origin: BASE_URL,
      },
    }
  );
  check(res, { "analyze ok": (r) => r.status === 200 || r.status === 502 });
  errorRate.add(!(res.status === 200 || res.status === 502));
  return res;
}

export function ocrCapture(token, captureId) {
  const res = http.post(
    `${BASE_URL}/api/ocr`,
    JSON.stringify({ captureId, attempt: 1 }),
    {
      headers: {
        "Content-Type": "application/json",
        "x-session-token": token,
        Origin: BASE_URL,
      },
    }
  );
  check(res, { "ocr ok": (r) => r.status === 200 || r.status === 502 });
  errorRate.add(!(res.status === 200 || res.status === 502));
  return res;
}

export function sendFeedback(token, payload) {
  const res = http.post(`${BASE_URL}/api/feedback`, JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "x-session-token": token,
      Origin: BASE_URL,
    },
  });
  check(res, { "feedback ok": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  return res;
}

export function askQuestion(token, payload) {
  const res = http.post(`${BASE_URL}/api/qa`, JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "x-session-token": token,
      Origin: BASE_URL,
    },
  });
  check(res, { "qa ok": (r) => r.status === 200 || r.status === 502 });
  errorRate.add(!(res.status === 200 || r.status === 502));
  return res;
}
