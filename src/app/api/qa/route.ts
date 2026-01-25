import { NextResponse } from "next/server";
import { answerQuestionStream } from "@/ai/answerQuestion";
import { recordQualityCount, recordQualityLatency } from "@/lib/qualityMetrics";
import { serializeQaStreamEvent } from "@/lib/qaStream";
import {
  badRequest,
  createRouteContext,
  handleApiKeyError,
  handleModelTextError,
  readJsonRecord,
  runCommonGuards,
  safeRecordMetrics,
} from "@/lib/apiRouteUtils";

export const runtime = "nodejs";

const MAX_QUESTION_CHARS = 240;
const MAX_CONTEXT_CHARS = 3500;
const MAX_ANSWER_CHARS = 420;

export async function POST(req: Request) {
  const ctx = createRouteContext(req);
  try {
    const guardError = await runCommonGuards(req, ctx, {
      sessionMessage: "Sessao expirada. Refaca a analise do documento e tente novamente.",
      rateLimitPrefix: "qa",
      rateLimitTag: "api.qa",
    });
    if (guardError) return guardError;

    const body = await readJsonRecord(req);
    if (!body) return badRequest("Requisicao invalida.");

    const question = typeof body.question === "string" ? body.question.trim() : "";
    const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
    const context = typeof body.context === "string" ? body.context.trim() : "";

    if (!question || question.length < 4) return badRequest("Pergunta muito curta.");
    if (question.length > MAX_QUESTION_CHARS) return badRequest("Pergunta longa demais.");
    if (!context) return badRequest("Contexto do documento nao informado.");
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

          const durationMs = ctx.durationMs();
          if (!answerText.trim()) {
            await safeRecordMetrics([
              recordQualityCount("qa_model_error"),
              recordQualityLatency("qa_latency_ms", durationMs),
            ]);

            console.log("[api.qa]", {
              requestId: ctx.requestId,
              ip: ctx.ip,
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

          await safeRecordMetrics([
            recordQualityLatency("qa_latency_ms", durationMs),
            attempt > 1 ? recordQualityCount("qa_retry") : Promise.resolve(),
          ]);

          console.log("[api.qa]", {
            requestId: ctx.requestId,
            ip: ctx.ip,
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

    const apiKeyError = handleApiKeyError(code);
    if (apiKeyError) return apiKeyError;

    const modelTextError = await handleModelTextError(code, {
      ctx,
      countMetric: "qa_model_error",
      latencyMetric: "qa_latency_ms",
      message: "Modelo nao retornou texto valido",
    });
    if (modelTextError) return modelTextError;

    console.error("[api.qa]", err);
    return badRequest("Erro interno ao responder pergunta", 500);
  }
}
