import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { badRequest, createRouteContext, readJsonRecord, runCommonGuards, shouldLogApi } from "@/lib/apiRouteUtils";
import { API_ERROR_MESSAGES } from "@/lib/constants";

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

function validateFeedbackBody(body: unknown): { valid: false; error: string } | { valid: true; helpful: boolean; reason: string; confidenceBucket: string; contextSource: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: API_ERROR_MESSAGES.INVALID_REQUEST };
  }

  const bodyObj = body as Record<string, unknown>;
  if (typeof bodyObj.helpful !== "boolean") {
    return { valid: false, error: API_ERROR_MESSAGES.FEEDBACK_INVALID };
  }

  const helpful = Boolean(bodyObj.helpful);
  const rawReason = typeof bodyObj.reason === "string" ? bodyObj.reason.trim().slice(0, MAX_REASON_CHARS) : "";
  const reason = helpful ? "" : rawReason;
  const confidenceBucket = typeof bodyObj.confidenceBucket === "string" ? bodyObj.confidenceBucket.trim().slice(0, MAX_SOURCE_CHARS) : "unknown";
  const contextSource = typeof bodyObj.contextSource === "string" ? bodyObj.contextSource.trim().slice(0, MAX_SOURCE_CHARS) : "unknown";

  return { valid: true, helpful, reason, confidenceBucket, contextSource };
}

async function processFeedback(helpful: boolean, reason: string, confidenceBucket: string, contextSource: string, ctx: ReturnType<typeof createRouteContext>): Promise<void> {
  await recordFeedback(helpful, reason);
  logFeedback(ctx, helpful, reason, confidenceBucket, contextSource);
}

async function recordFeedback(helpful: boolean, reason: string): Promise<void> {
  if (isRedisConfigured()) {
    const redis = getRedis();
    const day = todayKey();
    await redis.incr(`feedback:${day}:${helpful ? "yes" : "no"}`);
    if (!helpful && reason) {
      await redis.incr(`feedback:${day}:reason:${slugify(reason)}`);
    }
  }
}

function logFeedback(ctx: ReturnType<typeof createRouteContext>, helpful: boolean, reason: string, confidenceBucket: string, contextSource: string): void {
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
}

export async function POST(req: Request) {
  const ctx = createRouteContext(req);
  try {
    const guardError = await runCommonGuards(req, ctx, {
      sessionMessage: API_ERROR_MESSAGES.SESSION_EXPIRED_FEEDBACK,
      rateLimitPrefix: "feedback",
      rateLimitTag: "api.feedback",
    });
    if (guardError) return guardError;

    const body = await readJsonRecord(req);
    if (!body) return badRequest(API_ERROR_MESSAGES.INVALID_REQUEST);

    const validation = validateFeedbackBody(body);
    if (!validation.valid) return badRequest(validation.error);

    const { helpful, reason, confidenceBucket, contextSource } = validation;

    await processFeedback(helpful, reason, confidenceBucket, contextSource, ctx);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (shouldLogApi()) {
      console.error("[api.feedback]", err);
    }
    return badRequest(API_ERROR_MESSAGES.INTERNAL_ERROR_FEEDBACK, 500);
  }
}
