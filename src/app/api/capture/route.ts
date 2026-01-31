import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { cleanupMemoryStore, isRedisConfigured, memoryStats, setCapture } from "@/lib/captureStoreServer";
import { badRequest, createRouteContext, readJsonRecord, runCommonGuards } from "@/lib/apiRouteUtils";
import { parseDataUrl } from "@/lib/dataUrl";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const MAX_CAPTURE_COUNT = 80;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;
const SHOULD_LOG_API = process.env.API_LOGS !== "0";

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
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  return null;
}

function validateImageBase64(base64: string, declaredMime: string): ValidatedImage | ValidationError {
  let buf: Buffer;
  try {
    buf = Buffer.from(base64, "base64");
  } catch {
    return { ok: false, error: "Base64 invalido." };
  }

  if (buf.byteLength < 32) return { ok: false, error: "Imagem invalida." };

  if (buf.byteLength > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "A imagem e muito grande. Tente aproximar o documento ou usar boa iluminacao.",
      status: 413,
    };
  }

  const detected = detectMime(buf);
  if (!detected) return { ok: false, error: "Tipo de imagem nao suportado. Use JPG, PNG ou WebP." };

  if (declaredMime && detected !== declaredMime) return { ok: false, error: "Tipo de imagem invalido." };

  return { ok: true, buffer: buf, bytes: buf.byteLength, mimeType: detected };
}

type ImageInputResult =
  | { ok: true; rawBase64: string; declaredMime: string }
  | { ok: false; error: string };

function parseImageInput(body: Record<string, unknown>): ImageInputResult {
  if (typeof body.imageBase64 === "string") {
    const parsed = parseDataUrl(body.imageBase64, { requireImage: true });
    if (!parsed) return { ok: false, error: "Imagem invalida." };
    return { ok: true, rawBase64: parsed.base64, declaredMime: parsed.mimeType };
  }

  if (typeof body.imageBase64Raw === "string" && typeof body.mimeType === "string") {
    return { ok: true, rawBase64: body.imageBase64Raw, declaredMime: body.mimeType };
  }

  return { ok: false, error: "Imagem nao informada." };
}

function extractOcrImageData(body: Record<string, unknown>, originalBytes: number) {
  let ocrImageBase64 = "";
  let ocrBytes = 0;
  if (typeof body.ocrImageBase64 !== "string") return { ocrImageBase64, ocrBytes };

  const parsed = parseDataUrl(body.ocrImageBase64, { requireImage: true });
  if (!parsed) {
    console.warn("[api.capture] OCR data URL invalida.");
    return { ocrImageBase64, ocrBytes };
  }

  const ocrValidated = validateImageBase64(parsed.base64, parsed.mimeType);
  if (!ocrValidated.ok) {
    console.warn("[api.capture] OCR invalido.", ocrValidated.error);
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
    return "O sistema esta temporariamente ocupado. Tente novamente em alguns minutos.";
  }
  const projectedTotal = currentTotal + totalBytes;
  if (projectedTotal > MAX_TOTAL_BYTES) {
    return "O sistema esta temporariamente cheio. Tente novamente em instantes.";
  }
  return null;
}

export async function POST(req: Request) {
  const ctx = createRouteContext(req);
  try {
    const guardError = await runCommonGuards(req, ctx, {
      sessionMessage: "Sessao expirada. Volte para a camera e tire outra foto para continuar.",
      rateLimitPrefix: "capture",
      rateLimitTag: "api.capture",
    });
    if (guardError) return guardError;

    cleanupMemoryStore();

    const body = await readJsonRecord(req);
    if (!body) return badRequest("Requisicao invalida.");

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

    if (SHOULD_LOG_API) {
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
    console.error("[api.capture]", err);
    return badRequest("Erro interno ao receber imagem.", 500);
  }
}
