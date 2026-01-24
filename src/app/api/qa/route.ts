import { NextResponse } from "next/server";
import crypto from "crypto";
import { answerQuestionStream } from "@/ai/answerQuestion";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";
import { recordQualityCount, recordQualityLatency } from "@/lib/qualityMetrics";
import { serializeQaStreamEvent } from "@/lib/qaStream";
import { isRecord } from "@/lib/typeGuards";

export const runtime = "nodejs";

const MAX_QUESTION_CHARS = 240;
const MAX_CONTEXT_CHARS = 3500;
const MAX_ANSWER_CHARS = 420;

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

    const body = await req.json().catch(() => null);
    if (!isRecord(body)) {
      return badRequest("Requisição inválida.");
    }

    const question = typeof body.question === "string" ? body.question.trim() : "";
    const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
    const context = typeof body.context === "string" ? body.context.trim() : "";

    if (!question || question.length < 4) return badRequest("Pergunta muito curta.");
    if (question.length > MAX_QUESTION_CHARS) return badRequest("Pergunta longa demais.");
    if (!context) return badRequest("Contexto do documento não informado.");
    if (context.length > MAX_CONTEXT_CHARS) return badRequest("Contexto muito longo.");

    const { stream, meta, promptId } = await answerQuestionStream({ question, context });

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async start(controller) {
        let answerText = "";
        let sentChars = 0;
        try {
          for await (const chunk of stream) {
            if (!chunk) continue;
            if (sentChars >= MAX_ANSWER_CHARS) break;

            const remaining = MAX_ANSWER_CHARS - sentChars;
            const next = chunk.length > remaining ? chunk.slice(0, remaining) : chunk;
            if (!next) continue;

            sentChars += next.length;
            answerText += next;
            controller.enqueue(encoder.encode(serializeQaStreamEvent({ type: "delta", text: next })));
          }

          const durationMs = Date.now() - startedAt;
          if (!answerText.trim()) {
            try {
              await Promise.all([
                recordQualityCount("qa_model_error"),
                recordQualityLatency("qa_latency_ms", durationMs),
              ]);
            } catch (err) {
              console.warn("[metrics]", err);
            }
            console.log("[api.qa]", {
              requestId,
              ip,
              status: 502,
              provider: meta.provider,
              model: meta.model,
              promptId,
              duration_ms: durationMs,
            });
            controller.enqueue(
              encoder.encode(serializeQaStreamEvent({ type: "error", message: "Modelo nao retornou texto valido" }))
            );
            controller.close();
            return;
          }

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

          controller.enqueue(encoder.encode(serializeQaStreamEvent({ type: "done" })));
          controller.close();
        } catch (err) {
          console.error("[api.qa]", err);
          controller.enqueue(
            encoder.encode(serializeQaStreamEvent({ type: "error", message: "Erro interno ao responder pergunta" }))
          );
          controller.close();
        }
      },
    });

    return new NextResponse(responseStream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

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
