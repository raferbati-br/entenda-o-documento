import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { badRequest, createRouteContext, readJsonRecord, runCommonGuards, shouldLogApi } from "@/lib/apiRouteUtils";

export const runtime = "nodejs";

const MAX_REASON_CHARS = 80;
const MAX_SOURCE_CHARS = 20;

let redisClient: Redis | null = null;

function isRedisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis(): Redis {
  redisClient ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return redisClient;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string) {
  const lower = value.toLowerCase().trim();
  let result = "";
  let lastWasUnderscore = false;

  for (const element of lower) {
    const ch = element;
    const isAlphaNum = ch >= "a" && ch <= "z" || ch >= "0" && ch <= "9";
    if (isAlphaNum) {
      result += ch;
      lastWasUnderscore = false;
      continue;
    }
    if (!lastWasUnderscore) {
      result += "_";
      lastWasUnderscore = true;
    }
  }

  let start = 0;
  let end = result.length;
  while (start < end && result[start] === "_") start += 1;
  while (end > start && result[end - 1] === "_") end -= 1;
  return result.slice(start, end).slice(0, 32);
}

export async function POST(req: Request) {
  const ctx = createRouteContext(req);
  try {
    const guardError = await runCommonGuards(req, ctx, {
      sessionMessage: "Sessao expirada. Refaca a analise para enviar feedback.",
      rateLimitPrefix: "feedback",
      rateLimitTag: "api.feedback",
    });
    if (guardError) return guardError;

    const body = await readJsonRecord(req);
    if (!body) return badRequest("Requisicao invalida.");

    if (typeof body.helpful !== "boolean") return badRequest("Feedback invalido.");

    const helpful = Boolean(body.helpful);
    const rawReason = typeof body.reason === "string" ? body.reason.trim().slice(0, MAX_REASON_CHARS) : "";
    const reason = helpful ? "" : rawReason;
    const confidenceBucket =
      typeof body.confidenceBucket === "string" ? body.confidenceBucket.trim().slice(0, MAX_SOURCE_CHARS) : "unknown";
    const contextSource =
      typeof body.contextSource === "string" ? body.contextSource.trim().slice(0, MAX_SOURCE_CHARS) : "unknown";

    if (isRedisConfigured()) {
      const redis = getRedis();
      const day = todayKey();
      await redis.incr(`feedback:${day}:${helpful ? "yes" : "no"}`);
      if (!helpful && reason) {
        await redis.incr(`feedback:${day}:reason:${slugify(reason)}`);
      }
    }

    if (shouldLogApi()) {
      console.log("[api.feedback]", {
        requestId: ctx.requestId,
        ip: ctx.ip,
        status: 200,
        helpful,
        reason,
        confidenceBucket,
        contextSource,
        duration_ms: ctx.durationMs(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (shouldLogApi()) {
      console.error("[api.feedback]", err);
    }
    return badRequest("Erro interno ao registrar feedback", 500);
  }
}
