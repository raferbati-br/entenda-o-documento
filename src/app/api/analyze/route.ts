import { NextResponse } from "next/server";
import { analyzeDocument } from "@/ai/analyzeDocument";
import { cleanupMemoryStore, deleteCapture, getCapture } from "@/lib/captureStoreServer";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";
import { recordQualityCount, recordQualityLatency } from "@/lib/qualityMetrics";

export const runtime = "nodejs";

// ===== Route =====
export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const requestId = crypto.randomUUID();
    if (!isOriginAllowed(req)) {
      return NextResponse.json({ ok: false, error: "Origem não permitida" }, { status: 403 });
    }

    const token = req.headers.get("x-session-token") || "";
    if (!verifySessionToken(token)) {
      return NextResponse.json({ ok: false, error: "Token inválido ou expirado" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`analyze:${ip}`);
    if (!rl.ok) {
      console.log("[api.analyze]", { requestId, ip, status: 429, duration_ms: Date.now() - startedAt });
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
        { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
      );
    }

    cleanupMemoryStore();

    const body: any = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });

    const captureId = typeof body.captureId === "string" ? body.captureId : "";
    const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
    let imageDataUrl = "";

    if (captureId) {
      const entry = await getCapture(captureId);
      if (entry?.imageBase64) {
        imageDataUrl = entry.imageBase64;

        // Free after use
        await deleteCapture(captureId);
      }
    }

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { ok: false, error: "Imagem não encontrada ou inválida (capture expirou)" },
        { status: 404 }
      );
    }

    // Chama a camada de IA (prompt + provider + parse + postprocess)
    const { result, meta, promptId, stats } = await analyzeDocument(imageDataUrl);
    const durationMs = Date.now() - startedAt;
    try {
      await Promise.all([
        recordQualityCount("analyze_total"),
        recordQualityLatency("analyze_latency_ms", durationMs),
        stats.confidenceLow ? recordQualityCount("analyze_low_confidence") : Promise.resolve(),
        stats.sanitizerApplied ? recordQualityCount("analyze_sanitizer") : Promise.resolve(),
        attempt > 1 ? recordQualityCount("analyze_retry") : Promise.resolve(),
      ]);
    } catch (err) {
      console.warn("[metrics]", err);
    }

    console.log("[api.analyze]", {
      requestId,
      ip,
      status: 200,
      provider: meta.provider,
      model: meta.model,
      promptId,
      duration_ms: durationMs,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    const code = String(err?.message || "");

    if (code === "OPENAI_API_KEY_NOT_SET") {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY não configurada" }, { status: 500 });
    }

    if (code === "MODEL_NO_JSON" || code === "MODEL_INVALID_JSON") {
      const durationMs = Date.now() - startedAt;
      try {
        await Promise.all([
          recordQualityCount("analyze_invalid_json"),
          recordQualityLatency("analyze_latency_ms", durationMs),
        ]);
      } catch (err) {
        console.warn("[metrics]", err);
      }
      return NextResponse.json({ ok: false, error: "Modelo nao retornou JSON valido" }, { status: 502 });
    }

    console.error("[api.analyze]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao analisar documento" }, { status: 500 });
  }
}
