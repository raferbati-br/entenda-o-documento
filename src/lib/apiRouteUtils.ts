import crypto from "crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";
import { recordQualityCount, recordQualityLatency } from "@/lib/qualityMetrics";
import { isRecord } from "@/lib/typeGuards";

export type RouteContext = {
  startedAt: number;
  requestId: string;
  ip: string;
  durationMs: () => number;
};

export function createRouteContext(req: Request): RouteContext {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return {
    startedAt,
    requestId,
    ip,
    durationMs: () => Date.now() - startedAt,
  };
}

export function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, error: message }, { status, headers });
}

export function badRequest(message: string, status = 400) {
  return jsonError(message, status);
}

export function ensureOriginAllowed(req: Request) {
  if (isOriginAllowed(req)) return null;
  return jsonError("Origem nao permitida", 403);
}

export function ensureSessionToken(req: Request, message: string) {
  const token = req.headers.get("x-session-token") || "";
  if (verifySessionToken(token)) return null;
  return jsonError(message, 401);
}

export async function ensureRateLimit(prefix: string, ctx: RouteContext, tag: string) {
  const rl = await rateLimit(`${prefix}:${ctx.ip}`);
  if (rl.ok) return null;
  console.log(`[${tag}]`, { requestId: ctx.requestId, ip: ctx.ip, status: 429, duration_ms: ctx.durationMs() });
  return jsonError("Muitas tentativas. Aguarde um pouco e tente novamente.", 429, {
    "Retry-After": String(rl.resetSeconds),
  });
}

type GuardOptions = {
  rateLimitPrefix?: string;
  rateLimitTag?: string;
  sessionMessage?: string;
  requireSession?: boolean;
};

export async function runCommonGuards(req: Request, ctx: RouteContext, options: GuardOptions) {
  const originError = ensureOriginAllowed(req);
  if (originError) return originError;

  const shouldCheckSession = options.requireSession !== false;
  if (shouldCheckSession) {
    const message = options.sessionMessage ?? "Sessao expirada.";
    const sessionError = ensureSessionToken(req, message);
    if (sessionError) return sessionError;
  }

  if (options.rateLimitPrefix && options.rateLimitTag) {
    const rateLimitError = await ensureRateLimit(options.rateLimitPrefix, ctx, options.rateLimitTag);
    if (rateLimitError) return rateLimitError;
  }

  return null;
}

export async function readJsonRecord(req: Request) {
  const body = await req.json().catch(() => null);
  return isRecord(body) ? body : null;
}

export async function safeRecordMetrics(tasks: Array<Promise<unknown>>) {
  try {
    await Promise.all(tasks);
  } catch (err) {
    console.warn("[metrics]", err);
  }
}

export function handleApiKeyError(code: string, message = "Chave de API nao configurada") {
  if (code !== "API_KEY_NOT_SET") return null;
  return jsonError(message, 500);
}

export function handleTokenSecretError(code: string, message = "API_TOKEN_SECRET nao configurada") {
  if (code !== "API_TOKEN_SECRET_NOT_SET") return null;
  return jsonError(message, 500);
}

type ModelErrorOptions = {
  ctx: RouteContext;
  countMetric: Parameters<typeof recordQualityCount>[0];
  latencyMetric: Parameters<typeof recordQualityLatency>[0];
  message: string;
  status?: number;
};

export async function handleModelJsonError(code: string, options: ModelErrorOptions) {
  if (code !== "MODEL_NO_JSON" && code !== "MODEL_INVALID_JSON") return null;
  const durationMs = options.ctx.durationMs();
  await safeRecordMetrics([
    recordQualityCount(options.countMetric),
    recordQualityLatency(options.latencyMetric, durationMs),
  ]);
  return jsonError(options.message, options.status ?? 502);
}

export async function handleModelTextError(code: string, options: ModelErrorOptions) {
  if (code !== "MODEL_NO_TEXT") return null;
  const durationMs = options.ctx.durationMs();
  await safeRecordMetrics([
    recordQualityCount(options.countMetric),
    recordQualityLatency(options.latencyMetric, durationMs),
  ]);
  return jsonError(options.message, options.status ?? 502);
}
