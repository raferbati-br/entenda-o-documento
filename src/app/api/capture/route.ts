import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { cleanupMemoryStore, isRedisConfigured, memoryStats, setCapture } from "@/lib/captureStoreServer";
import { badRequest, createRouteContext, readJsonRecord, runCommonGuards, shouldLogApi } from "@/lib/apiRouteUtils";
import { parseDataUrl } from "@/lib/dataUrl";
import { API_ERROR_MESSAGES } from "@/lib/constants";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const MAX_CAPTURE_COUNT = 80;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;

type ValidatedImage = {
  ok: true;
  buffer: Buffer;
  bytes: number;
  mimeType: string;
};

type ValidationError = {
  ok: false;
  error: string;
  status?: number;
};

function detectMime(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  return null;
}

function validateImageBase64(base64: string, declaredMime: string): ValidatedImage | ValidationError {
  let buf: Buffer;
  try {
    buf = Buffer.from(base64, "base64");
  } catch {
    return { ok: false, error: API_ERROR_MESSAGES.BASE64_INVALID };
  }

  if (buf.byteLength < 32) return { ok: false, error: API_ERROR_MESSAGES.IMAGE_INVALID };

  if (buf.byteLength > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: API_ERROR_MESSAGES.IMAGE_TOO_LARGE,
      status: 413,
    };
  }

  const detected = detectMime(buf);
  if (!detected) return { ok: false, error: API_ERROR_MESSAGES.IMAGE_TYPE_UNSUPPORTED };

  if (declaredMime && detected !== declaredMime) return { ok: false, error: API_ERROR_MESSAGES.IMAGE_TYPE_INVALID };

  return { ok: true, buffer: buf, bytes: buf.byteLength, mimeType: detected };
}

type ImageInputResult =
  | { ok: true; rawBase64: string; declaredMime: string }
  | { ok: false; error: string };

function parseImageInput(body: Record<string, unknown>): ImageInputResult {
  if (typeof body.imageBase64 === "string") {
    const parsed = parseDataUrl(body.imageBase64, { requireImage: true });
    if (!parsed) return { ok: false, error: API_ERROR_MESSAGES.IMAGE_INVALID };
    return { ok: true, rawBase64: parsed.base64, declaredMime: parsed.mimeType };
  }

  if (typeof body.imageBase64Raw === "string" && typeof body.mimeType === "string") {
    return { ok: true, rawBase64: body.imageBase64Raw, declaredMime: body.mimeType };
  }

  return { ok: false, error: API_ERROR_MESSAGES.IMAGE_NOT_PROVIDED };
}

function extractOcrImageData(body: Record<string, unknown>, originalBytes: number) {
  let ocrImageBase64 = "";
  let ocrBytes = 0;
  if (typeof body.ocrImageBase64 !== "string") return { ocrImageBase64, ocrBytes };

  const parsed = parseDataUrl(body.ocrImageBase64, { requireImage: true });
  if (!parsed) {
    if (shouldLogApi()) {
      console.warn("[api.capture] " + API_ERROR_MESSAGES.OCR_DATA_URL_INVALID + ".");
    }
    return { ocrImageBase64, ocrBytes };
  }

  const ocrValidated = validateImageBase64(parsed.base64, parsed.mimeType);
  if (!ocrValidated.ok) {
    if (shouldLogApi()) {
      console.warn("[api.capture] OCR invalido.", ocrValidated.error);
    }
    return { ocrImageBase64, ocrBytes };
  }

  if (ocrValidated.bytes < originalBytes) {
    ocrImageBase64 = `data:${ocrValidated.mimeType};base64,${parsed.base64}`;
    ocrBytes = ocrValidated.bytes;
  }

  return { ocrImageBase64, ocrBytes };
}

function getMemoryCapacityError(totalBytes: number) {
  if (isRedisConfigured()) return null;
  const { count, totalBytes: currentTotal } = memoryStats();
  if (count >= MAX_CAPTURE_COUNT) {
    return API_ERROR_MESSAGES.SYSTEM_BUSY;
  }
  const projectedTotal = currentTotal + totalBytes;
  if (projectedTotal > MAX_TOTAL_BYTES) {
    return API_ERROR_MESSAGES.SYSTEM_FULL;
  }
  return null;
}

export async function POST(req: Request) {
  const ctx = createRouteContext(req);
  try {
    const guardError = await runCommonGuards(req, ctx, {
      sessionMessage: API_ERROR_MESSAGES.SESSION_EXPIRED_CAPTURE,
      rateLimitPrefix: "capture",
      rateLimitTag: "api.capture",
    });
    if (guardError) return guardError;

    cleanupMemoryStore();

    const body = await readJsonRecord(req);
    if (!body) return badRequest(API_ERROR_MESSAGES.INVALID_REQUEST);

    const parsedInput = parseImageInput(body);
    if (!parsedInput.ok) return badRequest(parsedInput.error);
    const { rawBase64, declaredMime } = parsedInput;

    if (!rawBase64) return badRequest("Imagem invalida.");

    const validated = validateImageBase64(rawBase64, declaredMime);
    if (!validated.ok) return badRequest(validated.error, validated.status);

    const buf = validated.buffer;
    const mimeType = validated.mimeType;
    const imageBase64 = `data:${mimeType};base64,${rawBase64}`;

    const { ocrImageBase64, ocrBytes } = extractOcrImageData(body, buf.byteLength);

    const memoryError = getMemoryCapacityError(buf.byteLength + ocrBytes);
    if (memoryError) return badRequest(memoryError);

    const captureId = crypto.randomBytes(16).toString("hex");
    await setCapture(captureId, {
      imageBase64,
      mimeType,
      createdAt: Date.now(),
      bytes: buf.byteLength,
      ...(ocrImageBase64 ? { ocrImageBase64, ocrBytes } : {}),
    });

    if (shouldLogApi()) {
      console.log("[api.capture]", {
        requestId: ctx.requestId,
        ip: ctx.ip,
        status: 200,
        bytes: buf.byteLength,
        ocr_bytes: ocrBytes || 0,
        duration_ms: ctx.durationMs(),
      });
    }

    return NextResponse.json({ ok: true, captureId });
  } catch (err) {
    if (shouldLogApi()) {
      console.error("[api.capture]", err);
    }
    return badRequest(API_ERROR_MESSAGES.INTERNAL_ERROR_CAPTURE, 500);
  }
}
