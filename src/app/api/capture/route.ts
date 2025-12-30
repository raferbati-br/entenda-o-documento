import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type Entry = { imageBase64: string; createdAt: number };

const g = globalThis as any;
g.__CAPTURE_STORE__ = g.__CAPTURE_STORE__ || new Map<string, Entry>();
const store: Map<string, Entry> = g.__CAPTURE_STORE__;

const TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

function estimateBase64Bytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, (base64.length * 3) / 4 - padding);
}

function cleanup() {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now - v.createdAt > TTL_MS) store.delete(k);
  }
}

export async function POST(req: Request) {
  try {
    cleanup();

    const { imageBase64 } = await req.json();

    if (
      !imageBase64 ||
      typeof imageBase64 !== "string" ||
      !imageBase64.startsWith("data:image/")
    ) {
      return NextResponse.json({ ok: false, error: "Imagem inválida" }, { status: 400 });
    }

    const bytes = estimateBase64Bytes(imageBase64);
    if (bytes > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Imagem muito grande (máx. 4MB)" },
        { status: 413 }
      );
    }

    const captureId = crypto.randomBytes(16).toString("hex");
    store.set(captureId, { imageBase64, createdAt: Date.now() });

    return NextResponse.json({ ok: true, captureId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Erro ao receber imagem" }, { status: 500 });
  }
}
