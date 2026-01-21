import { NextResponse } from "next/server";
import crypto from "crypto";
import { answerQuestion } from "@/ai/answerQuestion";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";
import { recordQualityCount, recordQualityLatency } from "@/lib/qualityMetrics";

export const runtime = "nodejs";

const MAX_QUESTION_CHARS = 240;
const MAX_CONTEXT_CHARS = 3500;

function badRequest(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  try {
    if (!isOriginAllowed(req)) {
      return NextResponse.json({ ok: false, error: "Origem não permitida" }, { status: 403 });
    }

    const token = req.headers.get("x-session-token") || "";
    if (!verifySessionToken(token)) {
      return NextResponse.json(
        { ok: false, error: "Sessao expirada. Refaça a analise do documento e tente novamente." },
        { status: 401 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`qa:${ip}`);
    if (!rl.ok) {
      console.log("[api.qa]", { requestId, ip, status: 429, duration_ms: Date.now() - startedAt });
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
        { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
      );
    }

    const body: any = await req.json().catch(() => null);
    if (!body) return badRequest("Requisição inválida.");

    const question = typeof body.question === "string" ? body.question.trim() : "";
    const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
    const context = typeof body.context === "string" ? body.context.trim() : "";

    if (!question || question.length < 4) return badRequest("Pergunta muito curta.");
    if (question.length > MAX_QUESTION_CHARS) return badRequest("Pergunta longa demais.");
    if (!context) return badRequest("Contexto do documento não informado.");
    if (context.length > MAX_CONTEXT_CHARS) return badRequest("Contexto muito longo.");

    const { answer, meta, promptId } = await answerQuestion({ question, context });
    const durationMs = Date.now() - startedAt;
    try {
      await Promise.all([
        recordQualityLatency("qa_latency_ms", durationMs),
        attempt > 1 ? recordQualityCount("qa_retry") : Promise.resolve(),
      ]);
    } catch (err) {
      console.warn("[metrics]", err);
    }

    console.log("[api.qa]", {
      requestId,
      ip,
      status: 200,
      provider: meta.provider,
      model: meta.model,
      promptId,
      duration_ms: durationMs,
    });

    return NextResponse.json({ ok: true, answer });
  } catch (err: any) {
    const code = String(err?.message || "");

    if (code === "OPENAI_API_KEY_NOT_SET") {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY não configurada" }, { status: 500 });
    }

    if (code === "MODEL_NO_TEXT") {
      const durationMs = Date.now() - startedAt;
      try {
        await Promise.all([
          recordQualityCount("qa_model_error"),
          recordQualityLatency("qa_latency_ms", durationMs),
        ]);
      } catch (err) {
        console.warn("[metrics]", err);
      }
      return NextResponse.json({ ok: false, error: "Modelo não retornou texto válido" }, { status: 502 });
    }

    console.error("[api.qa]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao responder pergunta" }, { status: 500 });
  }
}
