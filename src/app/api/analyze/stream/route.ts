import { NextResponse } from "next/server";
import crypto from "crypto";
import { analyzeDocumentStream } from "@/ai/analyzeDocument";
import { postprocessWithStats } from "@/ai/postprocess";
import { cleanupMemoryStore, deleteCapture, getCapture } from "@/lib/captureStoreServer";
import { evaluateOcrText } from "@/lib/ocrTextQuality";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";
import { recordQualityCount, recordQualityLatency } from "@/lib/qualityMetrics";
import { extractCardsFromJsonStream, serializeAnalyzeStreamEvent } from "@/lib/analyzeStream";

export const runtime = "nodejs";

const TEXT_ONLY_VALUES = new Set(["1", "true", "yes", "on"]);

function isTextOnlyEnabled() {
  const value = String(process.env.ANALYZE_TEXT_ONLY || "").toLowerCase();
  return TEXT_ONLY_VALUES.has(value);
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// ===== Route =====
export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  try {
    if (!isOriginAllowed(req)) {
      return NextResponse.json({ ok: false, error: "Origem nÃ£o permitida" }, { status: 403 });
    }

    const token = req.headers.get("x-session-token") || "";
    if (!verifySessionToken(token)) {
      return NextResponse.json({ ok: false, error: "Sessao expirada. Tire outra foto para continuar." }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`analyze:${ip}`);
    if (!rl.ok) {
      console.log("[api.analyze.stream]", { requestId, ip, status: 429, duration_ms: Date.now() - startedAt });
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
        { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
      );
    }

    cleanupMemoryStore();

    const body: any = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "RequisiÃ§Ã£o invÃ¡lida." }, { status: 400 });

    const captureId = typeof body.captureId === "string" ? body.captureId : "";
    const attempt = Number(body.attempt) > 0 ? Number(body.attempt) : 1;
    const ocrText = typeof body.ocrText === "string" ? body.ocrText : "";
    let imageDataUrl = "";

    if (captureId) {
      const entry = await getCapture(captureId);
      if (entry?.imageBase64) {
        imageDataUrl = entry.imageBase64;
      }
      await deleteCapture(captureId);
    }

    const textOnlyEnabled = isTextOnlyEnabled();
    const ocrQuality = textOnlyEnabled && ocrText ? evaluateOcrText(ocrText) : null;
    const useTextOnly = Boolean(textOnlyEnabled && ocrQuality?.ok);
    const analysisMode = useTextOnly
      ? "text_only"
      : textOnlyEnabled && ocrText
        ? "image_fallback"
        : "image";

    if (!useTextOnly && (!imageDataUrl || !imageDataUrl.startsWith("data:image/"))) {
      return NextResponse.json(
        { ok: false, error: "Imagem nÃ£o encontrada ou invÃ¡lida (capture expirou)" },
        { status: 404 }
      );
    }

    const { stream, meta, promptId, prompt } = await analyzeDocumentStream(
      useTextOnly ? { documentText: ocrText } : { imageDataUrl }
    );

    const encoder = new TextEncoder();
    const seenCards = new Set<string>();
    let rawText = "";

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (!chunk) continue;
            rawText += chunk;

            const cards = extractCardsFromJsonStream(rawText, seenCards);
            for (const card of cards) {
              controller.enqueue(encoder.encode(serializeAnalyzeStreamEvent({ type: "card", card })));
            }
          }

          let parsed: any;
          try {
            parsed = JSON.parse(rawText);
          } catch {
            const extracted = extractFirstJsonObject(rawText);
            if (extracted) {
              parsed = JSON.parse(extracted);
            }
          }

          if (!parsed) {
            const durationMs = Date.now() - startedAt;
            try {
              await Promise.all([
                recordQualityCount("analyze_invalid_json"),
                recordQualityLatency("analyze_latency_ms", durationMs),
              ]);
            } catch (err) {
              console.warn("[metrics]", err);
            }
            console.log("[api.analyze.stream]", {
              requestId,
              ip,
              status: 502,
              provider: meta.provider,
              model: meta.model,
              promptId,
              analysisMode,
              duration_ms: durationMs,
            });
            controller.enqueue(
              encoder.encode(serializeAnalyzeStreamEvent({ type: "error", message: "Modelo nao retornou JSON valido" }))
            );
            controller.close();
            return;
          }

          const { result, stats } = postprocessWithStats(parsed, prompt);
          const durationMs = Date.now() - startedAt;
          try {
            await Promise.all([
              recordQualityCount("analyze_total"),
              recordQualityLatency("analyze_latency_ms", durationMs),
              stats.confidenceLow ? recordQualityCount("analyze_low_confidence") : Promise.resolve(),
              stats.sanitizerApplied ? recordQualityCount("analyze_sanitizer") : Promise.resolve(),
              attempt > 1 ? recordQualityCount("analyze_retry") : Promise.resolve(),
              useTextOnly ? recordQualityCount("analyze_text_only") : Promise.resolve(),
              analysisMode === "image_fallback" ? recordQualityCount("analyze_image_fallback") : Promise.resolve(),
            ]);
          } catch (err) {
            console.warn("[metrics]", err);
          }

          console.log("[api.analyze.stream]", {
            requestId,
            ip,
            status: 200,
            provider: meta.provider,
            model: meta.model,
            promptId,
            analysisMode,
            ocr_chars: ocrQuality?.length ?? 0,
            ocr_alpha_ratio: ocrQuality ? Number(ocrQuality.alphaRatio.toFixed(2)) : 0,
            duration_ms: durationMs,
          });

          controller.enqueue(encoder.encode(serializeAnalyzeStreamEvent({ type: "result", result })));
          controller.close();
        } catch (err) {
          console.error("[api.analyze.stream]", err);
          controller.enqueue(
            encoder.encode(serializeAnalyzeStreamEvent({ type: "error", message: "Erro interno ao analisar documento" }))
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
  } catch (err: any) {
    const code = String(err?.message || "");

    if (code === "OPENAI_API_KEY_NOT_SET") {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY nÃ£o configurada" }, { status: 500 });
    }

    console.error("[api.analyze.stream]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao analisar documento" }, { status: 500 });
  }
}
