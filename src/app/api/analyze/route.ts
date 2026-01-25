import { NextResponse } from "next/server";
import { analyzeDocument } from "@/ai/analyzeDocument";
import { cleanupMemoryStore, deleteCapture, getCapture } from "@/lib/captureStoreServer";
import { evaluateOcrText } from "@/lib/ocrTextQuality";
import { recordQualityCount, recordQualityLatency } from "@/lib/qualityMetrics";
import {
  badRequest,
  createRouteContext,
  handleApiKeyError,
  handleModelJsonError,
  readJsonRecord,
  runCommonGuards,
  safeRecordMetrics,
} from "@/lib/apiRouteUtils";

export const runtime = "nodejs";

const TEXT_ONLY_VALUES = new Set(["1", "true", "yes", "on"]);

function isTextOnlyEnabled() {
  const value = String(process.env.ANALYZE_TEXT_ONLY || "").toLowerCase();
  return TEXT_ONLY_VALUES.has(value);
}

export async function POST(req: Request) {
  const ctx = createRouteContext(req);
  try {
    const guardError = await runCommonGuards(req, ctx, {
      sessionMessage: "Sessao expirada. Tire outra foto para continuar.",
      rateLimitPrefix: "analyze",
      rateLimitTag: "api.analyze",
    });
    if (guardError) return guardError;

    cleanupMemoryStore();

    const body = await readJsonRecord(req);
    if (!body) return badRequest("Requisicao invalida.");

    const captureId = typeof body.captureId === "string" ? body.captureId : "";
    const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
    const ocrText = typeof body.ocrText === "string" ? body.ocrText : "";
    let imageDataUrl = "";

    if (captureId) {
      const entry = await getCapture(captureId);
      if (entry?.imageBase64) {
        imageDataUrl = entry.imageBase64;
      }

      await deleteCapture(captureId);
    }

    const textOnlyEnabled = isTextOnlyEnabled();
    const ocrQuality = textOnlyEnabled && ocrText ? evaluateOcrText(ocrText) : null;
    const useTextOnly = Boolean(textOnlyEnabled && ocrQuality?.ok);
    const analysisMode = useTextOnly
      ? "text_only"
      : textOnlyEnabled && ocrText
        ? "image_fallback"
        : "image";

    if (!useTextOnly && (!imageDataUrl || !imageDataUrl.startsWith("data:image/"))) {
      return badRequest("Imagem nao encontrada ou invalida (capture expirou)", 404);
    }

    const { result, meta, promptId, stats } = await analyzeDocument(
      useTextOnly ? { documentText: ocrText } : { imageDataUrl }
    );
    const durationMs = ctx.durationMs();

    await safeRecordMetrics([
      recordQualityCount("analyze_total"),
      recordQualityLatency("analyze_latency_ms", durationMs),
      stats.confidenceLow ? recordQualityCount("analyze_low_confidence") : Promise.resolve(),
      stats.sanitizerApplied ? recordQualityCount("analyze_sanitizer") : Promise.resolve(),
      attempt > 1 ? recordQualityCount("analyze_retry") : Promise.resolve(),
      useTextOnly ? recordQualityCount("analyze_text_only") : Promise.resolve(),
      analysisMode === "image_fallback" ? recordQualityCount("analyze_image_fallback") : Promise.resolve(),
    ]);

    console.log("[api.analyze]", {
      requestId: ctx.requestId,
      ip: ctx.ip,
      status: 200,
      provider: meta.provider,
      model: meta.model,
      promptId,
      analysisMode,
      ocr_chars: ocrQuality?.length ?? 0,
      ocr_alpha_ratio: ocrQuality ? Number(ocrQuality.alphaRatio.toFixed(2)) : 0,
      duration_ms: durationMs,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    const apiKeyError = handleApiKeyError(code);
    if (apiKeyError) return apiKeyError;

    const modelJsonError = await handleModelJsonError(code, {
      ctx,
      countMetric: "analyze_invalid_json",
      latencyMetric: "analyze_latency_ms",
      message: "Modelo nao retornou JSON valido",
    });
    if (modelJsonError) return modelJsonError;

    console.error("[api.analyze]", err);
    return badRequest("Erro interno ao analisar documento", 500);
  }
}
