import { NextResponse } from "next/server";
import crypto from "crypto";
import { extractDocumentText } from "@/ai/extractDocumentText";
import { getCapture } from "@/lib/captureStoreServer";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";
import { recordQualityCount, recordQualityLatency } from "@/lib/qualityMetrics";
import { isRecord } from "@/lib/typeGuards";

export const runtime = "nodejs";

function badRequest(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  try {
    if (!isOriginAllowed(req)) {
      return NextResponse.json({ ok: false, error: "Origem não permitida" }, { status: 403 });
    }

    const token = req.headers.get("x-session-token") || "";
    if (!verifySessionToken(token)) {
      return NextResponse.json({ ok: false, error: "Sessao expirada. Tire outra foto para continuar." }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`ocr:${ip}`);
    if (!rl.ok) {
      console.log("[api.ocr]", { requestId, ip, status: 429, duration_ms: Date.now() - startedAt });
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
        { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!isRecord(body)) {
      return badRequest("Requisição inválida.");
    }

    const captureId = typeof body.captureId === "string" ? body.captureId : "";
    const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
    if (!captureId) return badRequest("CaptureId não informado.");

    const entry = await getCapture(captureId);
    const imageDataUrl = entry?.imageBase64 || "";
    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { ok: false, error: "Imagem não encontrada ou inválida (capture expirou)" },
        { status: 404 }
      );
    }

    const { documentText, meta, promptId } = await extractDocumentText(imageDataUrl);
    const durationMs = Date.now() - startedAt;
    try {
      await Promise.all([
        recordQualityLatency("ocr_latency_ms", durationMs),
        attempt > 1 ? recordQualityCount("ocr_retry") : Promise.resolve(),
      ]);
    } catch (err) {
      console.warn("[metrics]", err);
    }

    console.log("[api.ocr]", {
      requestId,
      ip,
      status: 200,
      provider: meta.provider,
      model: meta.model,
      promptId,
      duration_ms: durationMs,
    });

    return NextResponse.json({ ok: true, documentText });
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    if (code === "OPENAI_API_KEY_NOT_SET") {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY não configurada" }, { status: 500 });
    }

    if (code === "MODEL_NO_JSON" || code === "MODEL_INVALID_JSON") {
      const durationMs = Date.now() - startedAt;
      try {
        await Promise.all([
          recordQualityCount("ocr_invalid_json"),
          recordQualityLatency("ocr_latency_ms", durationMs),
        ]);
      } catch (err) {
        console.warn("[metrics]", err);
      }
      return NextResponse.json({ ok: false, error: "Modelo não retornou JSON válido" }, { status: 502 });
    }

    console.error("[api.ocr]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao extrair texto" }, { status: 500 });
  }
}
