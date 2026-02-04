import { getQualityMetrics } from "@/lib/qualityMetrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MetricsPageProps = Readonly<{
  searchParams?: { token?: string };
}>;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

const headingStyle = { color: "#111111", margin: 0 };
const sectionHeadingStyle = { color: "#111111", margin: 0 };
const textStyle = { color: "#111111" };
const thStyleBase = { borderBottom: "1px solid #BDBDBD", padding: "8px", color: "#111111" };
const tdStyleBase = { padding: "8px", borderBottom: "1px solid #D0D0D0", color: "#111111" };

export default async function MetricsPage({ searchParams }: MetricsPageProps) {
  const requiredToken = process.env.METRICS_DASHBOARD_TOKEN;
  const token = typeof searchParams?.token === "string" ? searchParams?.token : "";

  if (requiredToken && token !== requiredToken) {
    return (
      <main style={{ padding: "24px", fontFamily: "Arial, sans-serif", color: "#111111", backgroundColor: "#FFFFFF" }}>
        <h1 style={headingStyle}>Metrics</h1>
        <p style={textStyle}>Missing or invalid token.</p>
      </main>
    );
  }

  const rows = await getQualityMetrics(7);

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif", color: "#111111", backgroundColor: "#FFFFFF" }}>
      <h1 style={headingStyle}>Quality Metrics (Last 7 Days)</h1>
      <p style={textStyle}>
        Source: aggregated counters stored in Redis (or in-memory fallback when Redis is not configured).
      </p>

      <section style={{ marginTop: "24px" }}>
        <h2 style={sectionHeadingStyle}>Analyze</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr>
              <th style={{ ...thStyleBase, textAlign: "left" }}>Day</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Total</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Invalid JSON</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Low Confidence</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Sanitizer</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Retries</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Text-only</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Image Fallback</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Avg Latency (ms)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`analyze-${row.day}`}>
                <td style={{ ...tdStyleBase }}>{row.day}</td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.analyze_total || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.analyze_invalid_json || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.analyze_low_confidence || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.analyze_sanitizer || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.analyze_retry || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.analyze_text_only || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.analyze_image_fallback || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.latency.analyze_latency_ms?.avg || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2 style={sectionHeadingStyle}>OCR</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr>
              <th style={{ ...thStyleBase, textAlign: "left" }}>Day</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Invalid JSON</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Retries</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Avg Latency (ms)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`ocr-${row.day}`}>
                <td style={{ ...tdStyleBase }}>{row.day}</td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.ocr_invalid_json || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.ocr_retry || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.latency.ocr_latency_ms?.avg || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2 style={sectionHeadingStyle}>Q&A</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr>
              <th style={{ ...thStyleBase, textAlign: "left" }}>Day</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Model Errors</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Retries</th>
              <th style={{ ...thStyleBase, textAlign: "right" }}>Avg Latency (ms)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`qa-${row.day}`}>
                <td style={{ ...tdStyleBase }}>{row.day}</td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.qa_model_error || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.counts.qa_retry || 0)}
                </td>
                <td style={{ ...tdStyleBase, textAlign: "right" }}>
                  {formatNumber(row.latency.qa_latency_ms?.avg || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
