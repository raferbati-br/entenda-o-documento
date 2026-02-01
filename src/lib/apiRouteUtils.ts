/**
 * Utilitários para rotas de API no Next.js.
 * Inclui criação de contexto, validações de segurança, rate limiting e métricas.
 */

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";
import { recordQualityCount, recordQualityLatency } from "@/lib/qualityMetrics";
import { isRecord } from "@/lib/typeGuards";
import { ERROR_MESSAGES } from "@/lib/constants";

export type RouteContext = {
  startedAt: number; // Timestamp de início
  requestId: string; // ID único da requisição
  ip: string; // IP do cliente
  durationMs: () => number; // Função para calcular duração
};

// Cria contexto para a rota, com ID e IP
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

// Retorna erro JSON padronizado
export function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, error: message }, { status, headers });
}

// Retorna erro de requisição ruim
export function badRequest(message: string, status = 400) {
  return jsonError(message, status);
}

// Verifica se origem é permitida
export function ensureOriginAllowed(req: Request) {
  if (isOriginAllowed(req)) return null;
  return jsonError(ERROR_MESSAGES.ORIGIN_NOT_ALLOWED, 403);
}

// Verifica token de sessão
export function ensureSessionToken(req: Request, message: string) {
  const token = req.headers.get("x-session-token") || "";
  if (verifySessionToken(token)) return null;
  return jsonError(message, 401);
}

// Verifica rate limit
export async function ensureRateLimit(prefix: string, ctx: RouteContext, tag: string) {
  const rl = await rateLimit(`${prefix}:${ctx.ip}`);
  if (rl.ok) return null;
  if (shouldLogApi()) {
    console.log(`[${tag}]`, { requestId: ctx.requestId, ip: ctx.ip, status: 429, duration_ms: ctx.durationMs() });
  }
  return jsonError(ERROR_MESSAGES.TOO_MANY_REQUESTS, 429, {
    "Retry-After": String(rl.resetSeconds),
  });
}

type GuardOptions = {
  rateLimitPrefix?: string; // Prefixo para rate limit
  rateLimitTag?: string; // Tag para logging
  sessionMessage?: string; // Mensagem de erro de sessão
  requireSession?: boolean; // Se sessão é obrigatória
};

// Executa validações comuns (origem, sessão, rate limit)
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

// Lê e valida JSON do corpo da requisição
export async function readJsonRecord(req: Request) {
  const body = await req.json().catch(() => null);
  return isRecord(body) ? body : null;
}

// Registra métricas de forma segura, ignorando erros
export async function safeRecordMetrics(tasks: Array<Promise<unknown>>) {
  try {
    await Promise.all(tasks);
  } catch (err) {
    console.warn("[metrics]", err);
  }
}

// Trata erro de chave de API
export function handleApiKeyError(code: string, message = ERROR_MESSAGES.API_KEY_NOT_CONFIGURED) {
  if (code !== "API_KEY_NOT_SET") return null;
  return jsonError(message, 500);
}

// Trata erro de segredo de token
export function handleTokenSecretError(code: string, message = ERROR_MESSAGES.TOKEN_SECRET_NOT_CONFIGURED) {
  if (code !== "API_TOKEN_SECRET_NOT_SET") return null;
  return jsonError(message, 500);
}

// Verifica se deve logar API
export function shouldLogApi() {
  return process.env.NODE_ENV !== "test" && process.env.API_LOGS !== "0";
}

type ModelErrorOptions = {
  ctx: RouteContext;
  countMetric: Parameters<typeof recordQualityCount>[0]; // Tipo da métrica de contagem
  latencyMetric: Parameters<typeof recordQualityLatency>[0]; // Tipo da métrica de latência
  message: string; // Mensagem de erro
  status?: number; // Status HTTP
};

// Trata erro de JSON do modelo
export async function handleModelJsonError(code: string, options: ModelErrorOptions) {
  if (code !== "MODEL_NO_JSON" && code !== "MODEL_INVALID_JSON") return null;
  const durationMs = options.ctx.durationMs();
  await safeRecordMetrics([
    recordQualityCount(options.countMetric),
    recordQualityLatency(options.latencyMetric, durationMs),
  ]);
  return jsonError(options.message, options.status ?? 502);
}

// Trata erro de texto do modelo
export async function handleModelTextError(code: string, options: ModelErrorOptions) {
  if (code !== "MODEL_NO_TEXT") return null;
  const durationMs = options.ctx.durationMs();
  await safeRecordMetrics([
    recordQualityCount(options.countMetric),
    recordQualityLatency(options.latencyMetric, durationMs),
  ]);
  return jsonError(options.message, options.status ?? 502);
}
