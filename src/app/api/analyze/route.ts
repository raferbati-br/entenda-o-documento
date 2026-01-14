import { NextResponse } from "next/server";
import { analyzeDocument } from "@/ai/analyzeDocument";
import { cleanupMemoryStore, deleteCapture, getCapture } from "@/lib/captureStoreServer";

export const runtime = "nodejs";

// ===== Route =====
export async function POST(req: Request) {
  try {
    cleanupMemoryStore();

    const body: any = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });

    const captureId = typeof body.captureId === "string" ? body.captureId : "";
    let imageDataUrl = "";

    if (captureId) {
      const entry = await getCapture(captureId);
      if (entry?.imageBase64) {
        imageDataUrl = entry.imageBase64;

        // Free after use
        await deleteCapture(captureId);
      }
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
