import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/qualityMetrics", () => ({
  getQualityMetrics: vi.fn(async () => [
    {
      day: "2026-01-01",
      counts: { analyze_total: 1 },
      latency: { analyze_latency_ms: { avg: 10 }, ocr_latency_ms: { avg: 20 }, qa_latency_ms: { avg: 30 } },
    },
  ]),
}));

import MetricsPage from "@/app/metrics/page";

describe("MetricsPage", () => {
  it("renders table when token is valid", async () => {
    process.env.METRICS_DASHBOARD_TOKEN = "token";
    const node = await MetricsPage({ searchParams: { token: "token" } });
    const html = renderToStaticMarkup(node as React.ReactElement);
    expect(html).toContain("Quality Metrics");
  });

  it("renders error when token missing", async () => {
    process.env.METRICS_DASHBOARD_TOKEN = "token";
    const node = await MetricsPage({ searchParams: { token: "bad" } });
    const html = renderToStaticMarkup(node as React.ReactElement);
    expect(html).toContain("Missing or invalid token");
  });
});
