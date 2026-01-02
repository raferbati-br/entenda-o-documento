import { NextResponse } from "next/server";
import { analyzeDocument } from "@/ai/analyzeDocument";

export const runtime = "nodejs";

// ===== Store (mesma do /api/capture) =====
type CaptureEntry = {
  imageBase64: string; // DataURL
  mimeType: string;
  createdAt: number;
  bytes: number;
};

const TTL_MS = 10 * 60 * 1000;

const g = globalThis as any;
g.__CAPTURE_STORE__ = g.__CAPTURE_STORE__ || new Map<string, CaptureEntry>();
const store: Map<string, CaptureEntry> = g.__CAPTURE_STORE__;

// ===== Helpers (store) =====
function cleanupExpired() {
  const t = Date.now();
  for (const [id, entry] of store.entries()) {
    if (t - entry.createdAt > TTL_MS) store.delete(id);
  }
}

// ===== Route =====
export async function POST(req: Request) {
  try {
    cleanupExpired();

    const body: any = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });

    const captureId = typeof body.captureId === "string" ? body.captureId : "";
    const directImageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";

    let imageDataUrl = "";

    if (captureId) {
      const entry = store.get(captureId);
      if (entry?.imageBase64) {
        imageDataUrl = entry.imageBase64;

        // Recomendo liberar após uso (evita pico de memória)
        store.delete(captureId);
      }
    }

    if (!imageDataUrl && directImageBase64) {
      imageDataUrl = directImageBase64;
    }

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { ok: false, error: "Imagem não encontrada ou inválida (capture expirou)" },
        { status: 404 }
      );
    }

    // Chama a camada de IA (prompt + provider + parse + postprocess)
    const { result, meta, promptId } = await analyzeDocument(imageDataUrl);

    // Log interno (sem expor ao usuário)
    console.log("[/api/analyze]", { provider: meta.provider, model: meta.model, promptId });

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    const code = String(err?.message || "");

    if (code === "OPENAI_API_KEY_NOT_SET") {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY não configurada" }, { status: 500 });
    }

    if (code === "MODEL_NO_JSON" || code === "MODEL_INVALID_JSON") {
      return NextResponse.json({ ok: false, error: "Modelo não retornou JSON válido" }, { status: 502 });
    }

    console.error("[/api/analyze]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao analisar documento" }, { status: 500 });
  }
}
