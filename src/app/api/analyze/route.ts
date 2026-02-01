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
  type RouteContext as ApiRouteContext,
  runCommonGuards,
  safeRecordMetrics,
  shouldLogApi,
} from "@/lib/apiRouteUtils";
import { API_ERROR_MESSAGES } from "@/lib/constants";

export const runtime = "nodejs";

const TEXT_ONLY_VALUES = new Set(["1", "true", "yes", "on"]);
function isTextOnlyEnabled() {
  const value = String(process.env.ANALYZE_TEXT_ONLY || "").toLowerCase();
  return TEXT_ONLY_VALUES.has(value);
}

type AnalyzeMode = "text_only" | "image_fallback" | "image";

async function readCaptureImage(captureId: string) {
  if (!captureId) return "";
  const entry = await getCapture(captureId);
  const imageDataUrl = entry?.imageBase64 ?? "";
  await deleteCapture(captureId);
  return imageDataUrl;
}

function resolveAnalysisMode(textOnlyEnabled: boolean, ocrText: string, ocrQualityOk: boolean) {
  const useTextOnly = Boolean(textOnlyEnabled && ocrQualityOk);
  let analysisMode: AnalyzeMode = "image";
  if (textOnlyEnabled && ocrText) {
    analysisMode = useTextOnly ? "text_only" : "image_fallback";
  }
  return { useTextOnly, analysisMode };
}

async function recordAnalyzeMetrics(options: {
  attempt: number;
  useTextOnly: boolean;
  analysisMode: AnalyzeMode;
  stats: { confidenceLow: boolean; sanitizerApplied: boolean };
  durationMs: number;
}) {
  const { attempt, useTextOnly, analysisMode, stats, durationMs } = options;
  await safeRecordMetrics([
    recordQualityCount("analyze_total"),
    recordQualityLatency("analyze_latency_ms", durationMs),
    stats.confidenceLow ? recordQualityCount("analyze_low_confidence") : Promise.resolve(),
    stats.sanitizerApplied ? recordQualityCount("analyze_sanitizer") : Promise.resolve(),
    attempt > 1 ? recordQualityCount("analyze_retry") : Promise.resolve(),
    useTextOnly ? recordQualityCount("analyze_text_only") : Promise.resolve(),
    analysisMode === "image_fallback" ? recordQualityCount("analyze_image_fallback") : Promise.resolve(),
  ]);
}

async function handleAnalyzeRequest(req: Request, ctx: ApiRouteContext) {
  const guardError = await runCommonGuards(req, ctx, {
    sessionMessage: API_ERROR_MESSAGES.SESSION_EXPIRED_ANALYZE,
    rateLimitPrefix: "analyze",
    rateLimitTag: "api.analyze",
  });
  if (guardError) return guardError;

  cleanupMemoryStore();

  const body = await readJsonRecord(req);
  if (!body) return badRequest(API_ERROR_MESSAGES.INVALID_REQUEST);

  const captureId = typeof body.captureId === "string" ? body.captureId : "";
  const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
  const ocrText = typeof body.ocrText === "string" ? body.ocrText : "";
  const imageDataUrl = await readCaptureImage(captureId);

  const textOnlyEnabled = isTextOnlyEnabled();
  const ocrQuality = textOnlyEnabled && ocrText ? evaluateOcrText(ocrText) : null;
  const { useTextOnly, analysisMode } = resolveAnalysisMode(textOnlyEnabled, ocrText, Boolean(ocrQuality?.ok));

  if (!useTextOnly && !imageDataUrl?.startsWith("data:image/")) {
    return badRequest(API_ERROR_MESSAGES.IMAGE_NOT_FOUND, 404);
  }

  const { result, meta, promptId, stats } = await analyzeDocument(
    useTextOnly ? { documentText: ocrText } : { imageDataUrl }
  );
  const durationMs = ctx.durationMs();

  await recordAnalyzeMetrics({ attempt, useTextOnly, analysisMode, stats, durationMs });

  if (shouldLogApi()) {
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
  }

  return NextResponse.json({ ok: true, result });
}

export async function POST(req: Request) {
  const ctx = createRouteContext(req);
  try {
    return await handleAnalyzeRequest(req, ctx);
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    const apiKeyError = handleApiKeyError(code);
    if (apiKeyError) return apiKeyError;

    const modelJsonError = await handleModelJsonError(code, {
      ctx,
      countMetric: "analyze_invalid_json",
      latencyMetric: "analyze_latency_ms",
      message: API_ERROR_MESSAGES.MODEL_INVALID_JSON,
    });
    if (modelJsonError) return modelJsonError;

    if (shouldLogApi()) {
      console.error("[api.analyze]", err);
    }
    return badRequest(API_ERROR_MESSAGES.INTERNAL_ERROR_ANALYZE, 500);
  }
}
