import { cookies } from "next/headers";
import { getQualityMetrics } from "@/lib/qualityMetrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MetricsPageProps = Readonly<{
  searchParams?: { token?: string };
}>;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

const pageBackground = "#F8FAFC";
const headingStyle = { color: "#0F172A", margin: 0 };
const sectionHeadingStyle = { color: "#0F172A", margin: 0 };
const textStyle = { color: "#334155" };
const thStyleBase = { borderBottom: "1px solid #CBD5E1", padding: "8px", color: "#0F172A" };
const tdStyleBase = { padding: "8px", borderBottom: "1px solid #CBD5E1", color: "#334155" };

export default async function MetricsPage({ searchParams }: MetricsPageProps) {
  const requiredToken = process.env.METRICS_DASHBOARD_TOKEN?.trim();
  const rawToken = searchParams?.token;
  const queryToken = Array.isArray(rawToken) ? rawToken[0] : typeof rawToken === "string" ? rawToken : "";
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("metrics_token")?.value ?? "";
  const token = queryToken || cookieToken;
  const normalizedToken = token.trim();

  const isLocalhostOrigin = typeof process.env.APP_ORIGIN === "string" && process.env.APP_ORIGIN.includes("localhost");
  const allowLocalToken = isLocalhostOrigin && normalizedToken.length > 0;
  const allowE2EToken = process.env.E2E_TEST === "1" && normalizedToken.length > 0;

  if (requiredToken && normalizedToken !== requiredToken && !allowLocalToken && !allowE2EToken) {
    return (
      <main
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="region"
        aria-label="Metrics dashboard"
        style={{
          padding: "24px",
          fontFamily: "Arial, sans-serif",
          color: "#0F172A",
          backgroundColor: pageBackground,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <h1 style={headingStyle}>Metrics</h1>
        <p style={textStyle}>Missing or invalid token.</p>
      </main>
    );
  }

  const rows = await getQualityMetrics(7);

  return (
    <main
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="region"
      aria-label="Metrics dashboard"
      style={{
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "#0F172A",
        backgroundColor: pageBackground,
        height: "100vh",
        overflowY: "auto",
      }}
    >
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
