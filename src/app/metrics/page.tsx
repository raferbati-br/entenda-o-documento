import { getQualityMetrics } from "@/lib/qualityMetrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MetricsPageProps = {
  searchParams?: { token?: string };
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function MetricsPage({ searchParams }: MetricsPageProps) {
  const requiredToken = process.env.METRICS_DASHBOARD_TOKEN;
  const token = typeof searchParams?.token === "string" ? searchParams?.token : "";

  if (requiredToken && token !== requiredToken) {
    return (
      <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
        <h1>Metrics</h1>
        <p>Missing or invalid token.</p>
      </main>
    );
  }

  const rows = await getQualityMetrics(7);

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1>Quality Metrics (Last 7 Days)</h1>
      <p style={{ color: "#555" }}>
        Source: aggregated counters stored in Redis (or in-memory fallback when Redis is not configured).
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Day</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Total</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Invalid JSON</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Low Confidence</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Sanitizer</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Retries</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Avg Latency (ms)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.day}>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{row.day}</td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "right" }}>
                {formatNumber(row.counts.analyze_total || 0)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "right" }}>
                {formatNumber(row.counts.analyze_invalid_json || 0)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "right" }}>
                {formatNumber(row.counts.analyze_low_confidence || 0)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "right" }}>
                {formatNumber(row.counts.analyze_sanitizer || 0)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "right" }}>
                {formatNumber(row.counts.analyze_retry || 0)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "right" }}>
                {formatNumber(row.latency.analyze_latency_ms?.avg || 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
