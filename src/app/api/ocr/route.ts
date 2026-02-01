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
  shouldLogApi,
} from "@/lib/apiRouteUtils";
import { API_ERROR_MESSAGES } from "@/lib/constants";

export const runtime = "nodejs";

async function validateRequest(req: Request, ctx: ReturnType<typeof createRouteContext>) {
  const guardError = await runCommonGuards(req, ctx, {
    sessionMessage: API_ERROR_MESSAGES.SESSION_EXPIRED,
    rateLimitPrefix: "ocr",
    rateLimitTag: "api.ocr",
  });
  if (guardError) return { error: guardError };

  const body = await readJsonRecord(req);
  if (!body) return { error: badRequest(API_ERROR_MESSAGES.INVALID_REQUEST) };

  const captureId = typeof body.captureId === "string" ? body.captureId : "";
  const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
  if (!captureId) return { error: badRequest(API_ERROR_MESSAGES.CAPTURE_ID_MISSING) };

  return { captureId, attempt };
}

async function validateCapture(captureId: string) {
  const entry = await getCapture(captureId);
  const imageDataUrl = entry?.ocrImageBase64 || entry?.imageBase64 || "";
  if (!imageDataUrl?.startsWith("data:image/")) {
    return { error: badRequest(API_ERROR_MESSAGES.IMAGE_NOT_FOUND, 404) };
  }
  return { imageDataUrl };
}

async function handleError(err: unknown, ctx: ReturnType<typeof createRouteContext>) {
  const code = err instanceof Error ? err.message : "";

  const apiKeyError = handleApiKeyError(code);
  if (apiKeyError) return apiKeyError;

  const modelJsonError = await handleModelJsonError(code, {
    ctx,
    countMetric: "ocr_invalid_json",
    latencyMetric: "ocr_latency_ms",
    message: API_ERROR_MESSAGES.MODEL_INVALID_JSON,
  });
  if (modelJsonError) return modelJsonError;

  if (shouldLogApi()) {
    console.error("[api.ocr]", err);
  }
  return badRequest(API_ERROR_MESSAGES.INTERNAL_ERROR_OCR, 500);
}

export async function POST(req: Request) {
  const ctx = createRouteContext(req);
  try {
    const validation = await validateRequest(req, ctx);
    if ("error" in validation) return validation.error;
    const { captureId, attempt } = validation;

    const capture = await validateCapture(captureId);
    if ("error" in capture) return capture.error;
    const { imageDataUrl } = capture;

    const { documentText, meta, promptId } = await extractDocumentText(imageDataUrl);
    const durationMs = ctx.durationMs();

    await safeRecordMetrics([
      recordQualityLatency("ocr_latency_ms", durationMs),
      attempt > 1 ? recordQualityCount("ocr_retry") : Promise.resolve(),
    ]);

    if (shouldLogApi()) {
      console.log("[api.ocr]", {
        requestId: ctx.requestId,
        ip: ctx.ip,
        status: 200,
        provider: meta.provider,
        model: meta.model,
        promptId,
        duration_ms: durationMs,
      });
    }

    return NextResponse.json({ ok: true, documentText });
  } catch (err: unknown) {
    return handleError(err, ctx);
  }
}
