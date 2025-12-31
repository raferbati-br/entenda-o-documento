import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type CaptureEntry = {
  imageBase64: string; // SEMPRE DataURL
  mimeType: string;
  createdAt: number;
  bytes: number;
};

const TTL_MS = 10 * 60 * 1000;
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const MAX_CAPTURE_COUNT = 80;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;

const g = globalThis as any;
g.__CAPTURE_STORE__ = g.__CAPTURE_STORE__ || new Map<string, CaptureEntry>();
const store: Map<string, CaptureEntry> = g.__CAPTURE_STORE__;

function cleanupExpired() {
  const t = Date.now();
  for (const [id, entry] of store.entries()) {
    if (t - entry.createdAt > TTL_MS) store.delete(id);
  }
}

function totalBytesInStore() {
  let sum = 0;
  for (const e of store.values()) sum += e.bytes || 0;
  return sum;
}

function detectMime(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  return null;
}

function badRequest(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    cleanupExpired();

    if (store.size >= MAX_CAPTURE_COUNT) {
      return badRequest("O sistema está temporariamente ocupado. Tente novamente em alguns minutos.");
    }

    const body: any = await req.json().catch(() => null);
    if (!body) return badRequest("Requisição inválida.");

    // ✅ IMPORTANTE: string SEMPRE (não null)
    let rawBase64 = "";
    let declaredMime = "";

    // A) DataURL
    if (typeof body.imageBase64 === "string") {
      const match = body.imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return badRequest("Imagem inválida.");
      declaredMime = match[1];
      rawBase64 = match[2];
    }
    // B) base64 puro + mimeType
    else if (typeof body.imageBase64Raw === "string" && typeof body.mimeType === "string") {
      rawBase64 = body.imageBase64Raw;
      declaredMime = body.mimeType;
    } else {
      return badRequest("Imagem não informada.");
    }

    if (!rawBase64) return badRequest("Imagem inválida.");

    // ✅ agora o TS aceita (rawBase64 é string)
    let buf: Buffer;
    try {
      buf = Buffer.from(rawBase64, "base64");
    } catch {
      return badRequest("Base64 inválido.");
    }

    if (buf.byteLength < 32) return badRequest("Imagem inválida.");

    if (buf.byteLength > MAX_IMAGE_BYTES) {
      return badRequest(
        "A imagem é muito grande. Tente aproximar o documento ou usar boa iluminação.",
        413
      );
    }

    const detected = detectMime(buf);
    if (!detected) return badRequest("Tipo de imagem não suportado. Use JPG, PNG ou WebP.");

    if (declaredMime && detected !== declaredMime) {
      return badRequest("Tipo de imagem inválido.");
    }

    const projectedTotal = totalBytesInStore() + buf.byteLength;
    if (projectedTotal > MAX_TOTAL_BYTES) {
      return badRequest("O sistema está temporariamente cheio. Tente novamente em instantes.");
    }

    const mimeType = detected;
    const imageBase64 = `data:${mimeType};base64,${rawBase64}`;

    const captureId = crypto.randomBytes(16).toString("hex");
    store.set(captureId, {
      imageBase64,
      mimeType,
      createdAt: Date.now(),
      bytes: buf.byteLength,
    });

    return NextResponse.json({ ok: true, captureId });
  } catch (err) {
    console.error("[/api/capture]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao receber imagem." }, { status: 500 });
  }
}
