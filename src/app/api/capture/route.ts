import { NextResponse } from "next/server";
import crypto from "crypto";
import { cleanupMemoryStore, isRedisConfigured, memoryStats, setCapture } from "@/lib/captureStoreServer";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";
import { isRecord } from "@/lib/typeGuards";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const MAX_CAPTURE_COUNT = 80;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;

type ParsedDataUrl = {
  mimeType: string;
  base64: string;
};

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

function parseDataUrl(value: string): ParsedDataUrl | null {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function validateImageBase64(base64: string, declaredMime: string): ValidatedImage | ValidationError {
  let buf: Buffer;
  try {
    buf = Buffer.from(base64, "base64");
  } catch {
    return { ok: false, error: "Base64 inválido." };
  }

  if (buf.byteLength < 32) return { ok: false, error: "Imagem inválida." };

  if (buf.byteLength > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "A imagem é muito grande. Tente aproximar o documento ou usar boa iluminação.",
      status: 413,
    };
  }

  const detected = detectMime(buf);
  if (!detected) return { ok: false, error: "Tipo de imagem não suportado. Use JPG, PNG ou WebP." };

  if (declaredMime && detected !== declaredMime) return { ok: false, error: "Tipo de imagem inválido." };

  return { ok: true, buffer: buf, bytes: buf.byteLength, mimeType: detected };
}

function badRequest(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();
    if (!isOriginAllowed(req)) {
      return NextResponse.json({ ok: false, error: "Origem não permitida" }, { status: 403 });
    }

    const token = req.headers.get("x-session-token") || "";
    if (!verifySessionToken(token)) {
      return NextResponse.json(
        { ok: false, error: "Sessao expirada. Volte para a camera e tire outra foto para continuar." },
        { status: 401 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`capture:${ip}`);
    if (!rl.ok) {
      console.log("[api.capture]", { requestId, ip, status: 429, duration_ms: Date.now() - startedAt });
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
        { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
      );
    }

    cleanupMemoryStore();

    const body = await req.json().catch(() => null);
    if (!isRecord(body)) return badRequest("Requisi??o inv?lida.");

    // ✅ IMPORTANTE: string SEMPRE (não null)
    let rawBase64 = "";
    let declaredMime = "";

    // A) DataURL
    if (typeof body.imageBase64 === "string") {
      const parsed = parseDataUrl(body.imageBase64);
      if (!parsed) return badRequest("Imagem inválida.");
      declaredMime = parsed.mimeType;
      rawBase64 = parsed.base64;
    }
    // B) base64 puro + mimeType
    else if (typeof body.imageBase64Raw === "string" && typeof body.mimeType === "string") {
      rawBase64 = body.imageBase64Raw;
      declaredMime = body.mimeType;
    } else {
      return badRequest("Imagem não informada.");
    }

    if (!rawBase64) return badRequest("Imagem inválida.");

    const validated = validateImageBase64(rawBase64, declaredMime);
    if (!validated.ok) return badRequest(validated.error, validated.status);

    const buf = validated.buffer;
    const mimeType = validated.mimeType;
    const imageBase64 = `data:${mimeType};base64,${rawBase64}`;

    let ocrImageBase64 = "";
    let ocrBytes = 0;
    if (typeof body.ocrImageBase64 === "string") {
      const parsed = parseDataUrl(body.ocrImageBase64);
      if (!parsed) {
        console.warn("[api.capture] OCR data URL invalida.");
      } else {
        const ocrValidated = validateImageBase64(parsed.base64, parsed.mimeType);
        if (!ocrValidated.ok) {
          console.warn("[api.capture] OCR invalido.", ocrValidated.error);
        } else if (ocrValidated.bytes < buf.byteLength) {
          ocrImageBase64 = `data:${ocrValidated.mimeType};base64,${parsed.base64}`;
          ocrBytes = ocrValidated.bytes;
        }
      }
    }

    if (!isRedisConfigured()) {
      const { count, totalBytes } = memoryStats();
      if (count >= MAX_CAPTURE_COUNT) {
        return badRequest("O sistema está temporariamente ocupado. Tente novamente em alguns minutos.");
      }
      const projectedTotal = totalBytes + buf.byteLength + ocrBytes;
      if (projectedTotal > MAX_TOTAL_BYTES) {
        return badRequest("O sistema está temporariamente cheio. Tente novamente em instantes.");
      }
    }

    const captureId = crypto.randomBytes(16).toString("hex");
    await setCapture(captureId, {
      imageBase64,
      mimeType,
      createdAt: Date.now(),
      bytes: buf.byteLength,
      ...(ocrImageBase64 ? { ocrImageBase64, ocrBytes } : {}),
    });

    console.log("[api.capture]", {
      requestId,
      ip,
      status: 200,
      bytes: buf.byteLength,
      ocr_bytes: ocrBytes || 0,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json({ ok: true, captureId });
  } catch (err) {
    console.error("[api.capture]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao receber imagem." }, { status: 500 });
  }
}
