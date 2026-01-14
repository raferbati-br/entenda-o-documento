import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  vus: 1,
  duration: "1m",
};

const tinyPngBase64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

export default function () {
  const tokenRes = http.get(`${BASE_URL}/api/session-token`, {
    headers: { Origin: BASE_URL },
  });
  const tokenJson = tokenRes.json();
  const token = tokenJson?.token || "";

  const captureRes = http.post(
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

  check(captureRes, { "capture ok": (r) => r.status === 200 });
  const captureId = captureRes.json()?.captureId;
  if (!captureId) return;

  const analyzeRes = http.post(
    `${BASE_URL}/api/analyze`,
    JSON.stringify({ captureId }),
    {
      headers: {
        "Content-Type": "application/json",
        "x-session-token": token,
        Origin: BASE_URL,
      },
    }
  );

  check(analyzeRes, { "analyze ok": (r) => r.status === 200 || r.status === 502 });
  sleep(12);
}
