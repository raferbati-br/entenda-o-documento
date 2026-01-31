import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { badRequest, createRouteContext, readJsonRecord, runCommonGuards } from "@/lib/apiRouteUtils";

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
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]/g, "_")
    .replaceAll(/_+/g, "_")
    .replace(/^_+/, "")
    .replace(/_+$/, "")
    .slice(0, 32);
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api.feedback]", err);
    return badRequest("Erro interno ao registrar feedback", 500);
  }
}
