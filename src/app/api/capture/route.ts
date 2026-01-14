import { NextResponse } from "next/server";
import crypto from "crypto";
import { cleanupMemoryStore, isRedisConfigured, memoryStats, setCapture } from "@/lib/captureStoreServer";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const MAX_CAPTURE_COUNT = 80;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;

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
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();
    if (!isOriginAllowed(req)) {
      return NextResponse.json({ ok: false, error: "Origem não permitida" }, { status: 403 });
    }

    const token = req.headers.get("x-session-token") || "";
    if (!verifySessionToken(token)) {
      return NextResponse.json({ ok: false, error: "Token inválido ou expirado" }, { status: 401 });
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

    if (!isRedisConfigured()) {
      const { count, totalBytes } = memoryStats();
      if (count >= MAX_CAPTURE_COUNT) {
        return badRequest("O sistema está temporariamente ocupado. Tente novamente em alguns minutos.");
      }
      const projectedTotal = totalBytes + buf.byteLength;
      if (projectedTotal > MAX_TOTAL_BYTES) {
        return badRequest("O sistema está temporariamente cheio. Tente novamente em instantes.");
      }
    }

    const mimeType = detected;
    const imageBase64 = `data:${mimeType};base64,${rawBase64}`;

    const captureId = crypto.randomBytes(16).toString("hex");
    await setCapture(captureId, {
      imageBase64,
      mimeType,
      createdAt: Date.now(),
      bytes: buf.byteLength,
    });

    console.log("[api.capture]", {
      requestId,
      ip,
      status: 200,
      bytes: buf.byteLength,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json({ ok: true, captureId });
  } catch (err) {
    console.error("[api.capture]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao receber imagem." }, { status: 500 });
  }
}
