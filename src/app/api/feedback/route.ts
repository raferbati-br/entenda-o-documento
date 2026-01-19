import { NextResponse } from "next/server";
import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { rateLimit } from "@/lib/rateLimit";
import { isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";

export const runtime = "nodejs";

const MAX_REASON_CHARS = 80;
const MAX_SOURCE_CHARS = 20;

let redisClient: Redis | null = null;

function isRedisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

function badRequest(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
}

export async function POST(req: Request) {
  try {
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();
    if (!isOriginAllowed(req)) {
      return NextResponse.json({ ok: false, error: "Origem não permitida" }, { status: 403 });
    }

    const token = req.headers.get("x-session-token") || "";
    if (!verifySessionToken(token)) {
      return NextResponse.json({ ok: false, error: "Token inválido ou expirado" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`feedback:${ip}`);
    if (!rl.ok) {
      console.log("[api.feedback]", { requestId, ip, status: 429, duration_ms: Date.now() - startedAt });
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
        { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
      );
    }

    const body: any = await req.json().catch(() => null);
    if (!body) return badRequest("Requisição inválida.");

    if (typeof body.helpful !== "boolean") return badRequest("Feedback inválido.");

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
      requestId,
      ip,
      status: 200,
      helpful,
      reason,
      confidenceBucket,
      contextSource,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api.feedback]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao registrar feedback" }, { status: 500 });
  }
}
