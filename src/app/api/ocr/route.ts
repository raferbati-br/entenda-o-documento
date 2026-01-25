import { NextResponse } from "next/server";
import { extractDocumentText } from "@/ai/extractDocumentText";
import { getCapture } from "@/lib/captureStoreServer";
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

export async function POST(req: Request) {
  const ctx = createRouteContext(req);
  try {
    const guardError = await runCommonGuards(req, ctx, {
      sessionMessage: "Sessao expirada. Tire outra foto para continuar.",
      rateLimitPrefix: "ocr",
      rateLimitTag: "api.ocr",
    });
    if (guardError) return guardError;

    const body = await readJsonRecord(req);
    if (!body) return badRequest("Requisicao invalida.");

    const captureId = typeof body.captureId === "string" ? body.captureId : "";
    const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
    if (!captureId) return badRequest("CaptureId nao informado.");

    const entry = await getCapture(captureId);
    const imageDataUrl = entry?.ocrImageBase64 || entry?.imageBase64 || "";
    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return badRequest("Imagem nao encontrada ou invalida (capture expirou)", 404);
    }

    const { documentText, meta, promptId } = await extractDocumentText(imageDataUrl);
    const durationMs = ctx.durationMs();

    await safeRecordMetrics([
      recordQualityLatency("ocr_latency_ms", durationMs),
      attempt > 1 ? recordQualityCount("ocr_retry") : Promise.resolve(),
    ]);

    console.log("[api.ocr]", {
      requestId: ctx.requestId,
      ip: ctx.ip,
      status: 200,
      provider: meta.provider,
      model: meta.model,
      promptId,
      duration_ms: durationMs,
    });

    return NextResponse.json({ ok: true, documentText });
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    const apiKeyError = handleApiKeyError(code);
    if (apiKeyError) return apiKeyError;

    const modelJsonError = await handleModelJsonError(code, {
      ctx,
      countMetric: "ocr_invalid_json",
      latencyMetric: "ocr_latency_ms",
      message: "Modelo nao retornou JSON valido",
    });
    if (modelJsonError) return modelJsonError;

    console.error("[api.ocr]", err);
    return badRequest("Erro interno ao extrair texto", 500);
  }
}
