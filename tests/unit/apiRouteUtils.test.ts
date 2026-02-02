import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: HeadersInit }) =>
      new Response(JSON.stringify(body), { status: init?.status ?? 200, headers: init?.headers }),
  },
}));

const rateLimitMock = vi.fn();
const isOriginAllowedMock = vi.fn();
const verifySessionTokenMock = vi.fn();
const recordQualityCountMock = vi.fn();
const recordQualityLatencyMock = vi.fn();

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
}));

vi.mock("@/lib/requestAuth", () => ({
  isOriginAllowed: (...args: unknown[]) => isOriginAllowedMock(...args),
  verifySessionToken: (...args: unknown[]) => verifySessionTokenMock(...args),
}));

vi.mock("@/lib/qualityMetrics", () => ({
  recordQualityCount: (...args: unknown[]) => recordQualityCountMock(...args),
  recordQualityLatency: (...args: unknown[]) => recordQualityLatencyMock(...args),
}));

import {
  createRouteContext,
  jsonError,
  badRequest,
  ensureOriginAllowed,
  ensureSessionToken,
  ensureRateLimit,
  runCommonGuards,
  readJsonRecord,
  safeRecordMetrics,
  handleApiKeyError,
  handleTokenSecretError,
  handleModelJsonError,
  handleModelTextError,
  shouldLogApi,
} from "@/lib/apiRouteUtils";


describe("apiRouteUtils", () => {
  beforeEach(() => {
    rateLimitMock.mockReset();
    isOriginAllowedMock.mockReset();
    verifySessionTokenMock.mockReset();
    recordQualityCountMock.mockReset();
    recordQualityLatencyMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates route context with ip", () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid");
    const req = new Request("https://example.com", { headers: { "x-forwarded-for": "1.2.3.4" } });
    const ctx = createRouteContext(req);
    expect(ctx.requestId).toBe("uuid");
    expect(ctx.ip).toBe("1.2.3.4");
    expect(ctx.durationMs()).toBe(0);
  });

  it("defaults ip to unknown when header is missing", () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid");
    const req = new Request("https://example.com");
    const ctx = createRouteContext(req);
    expect(ctx.ip).toBe("unknown");
  });

  it("builds json errors", async () => {
    const res = jsonError("nope", 403, { "x-test": "1" });
    expect(res.status).toBe(403);
    expect(res.headers.get("x-test")).toBe("1");
    await expect(res.json()).resolves.toEqual({ ok: false, error: "nope" });

    const res2 = badRequest("bad");
    expect(res2.status).toBe(400);
    await expect(res2.json()).resolves.toEqual({ ok: false, error: "bad" });
  });

  it("ensures origin allowed", () => {
    isOriginAllowedMock.mockReturnValue(true);
    const ok = ensureOriginAllowed(new Request("https://example.com"));
    expect(ok).toBeNull();

    isOriginAllowedMock.mockReturnValue(false);
    const err = ensureOriginAllowed(new Request("https://example.com"));
    expect(err?.status).toBe(403);
  });

  it("ensures session token", () => {
    verifySessionTokenMock.mockReturnValue(true);
    const ok = ensureSessionToken(new Request("https://example.com"), "msg");
    expect(ok).toBeNull();

    verifySessionTokenMock.mockReturnValue(false);
    const err = ensureSessionToken(new Request("https://example.com"), "msg");
    expect(err?.status).toBe(401);
  });

  it("enforces rate limit", async () => {
    rateLimitMock.mockResolvedValue({ ok: false, remaining: 0, resetSeconds: 5 });
    const ctx = { requestId: "r", ip: "ip", startedAt: 0, durationMs: () => 10 };
    const res = await ensureRateLimit("p", ctx, "tag");
    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBe("5");
  });

  it("logs rate limit when enabled", async () => {
    const originalEnv = { ...process.env };
    process.env.NODE_ENV = "production";
    process.env.API_LOGS = "1";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    rateLimitMock.mockResolvedValue({ ok: false, remaining: 0, resetSeconds: 5 });
    const ctx = { requestId: "r", ip: "ip", startedAt: 0, durationMs: () => 10 };

    await ensureRateLimit("p", ctx, "tag");

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
    process.env = originalEnv;
  });

  it("runs common guards", async () => {
    isOriginAllowedMock.mockReturnValue(true);
    verifySessionTokenMock.mockReturnValue(true);
    rateLimitMock.mockResolvedValue({ ok: true, remaining: 1, resetSeconds: 1 });
    const ctx = { requestId: "r", ip: "ip", startedAt: 0, durationMs: () => 1 };

    const res = await runCommonGuards(new Request("https://example.com"), ctx, {
      rateLimitPrefix: "p",
      rateLimitTag: "tag",
      sessionMessage: "s",
    });
    expect(res).toBeNull();
  });

  it("returns early when origin is blocked", async () => {
    isOriginAllowedMock.mockReturnValue(false);
    const ctx = { requestId: "r", ip: "ip", startedAt: 0, durationMs: () => 1 };
    const res = await runCommonGuards(new Request("https://example.com"), ctx, {});
    expect(res?.status).toBe(403);
  });

  it("skips session when requireSession is false", async () => {
    isOriginAllowedMock.mockReturnValue(true);
    verifySessionTokenMock.mockReturnValue(false);
    const ctx = { requestId: "r", ip: "ip", startedAt: 0, durationMs: () => 1 };
    const res = await runCommonGuards(new Request("https://example.com"), ctx, { requireSession: false });
    expect(res).toBeNull();
  });

  it("returns rate limit error when configured", async () => {
    isOriginAllowedMock.mockReturnValue(true);
    verifySessionTokenMock.mockReturnValue(true);
    rateLimitMock.mockResolvedValue({ ok: false, remaining: 0, resetSeconds: 2 });
    const ctx = { requestId: "r", ip: "ip", startedAt: 0, durationMs: () => 1 };
    const res = await runCommonGuards(new Request("https://example.com"), ctx, {
      rateLimitPrefix: "p",
      rateLimitTag: "tag",
    });
    expect(res?.status).toBe(429);
  });

  it("returns session error when token is invalid", async () => {
    isOriginAllowedMock.mockReturnValue(true);
    verifySessionTokenMock.mockReturnValue(false);
    const ctx = { requestId: "r", ip: "ip", startedAt: 0, durationMs: () => 1 };
    const res = await runCommonGuards(new Request("https://example.com"), ctx, { sessionMessage: "msg" });
    expect(res?.status).toBe(401);
  });

  it("reads json record safely", async () => {
    const okReq = new Request("https://example.com", { body: JSON.stringify({ a: 1 }), method: "POST" });
    await expect(readJsonRecord(okReq)).resolves.toEqual({ a: 1 });

    const badReq = new Request("https://example.com", { body: "nope", method: "POST" });
    await expect(readJsonRecord(badReq)).resolves.toBeNull();
  });

  it("records metrics safely", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await safeRecordMetrics([Promise.resolve(), Promise.reject(new Error("boom"))]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("handles api key and token errors", () => {
    expect(handleApiKeyError("OTHER")).toBeNull();
    expect(handleTokenSecretError("OTHER")).toBeNull();
    expect(handleApiKeyError("API_KEY_NOT_SET")?.status).toBe(500);
    expect(handleTokenSecretError("API_TOKEN_SECRET_NOT_SET")?.status).toBe(500);
  });

  it("handles model errors", async () => {
    const ctx = { requestId: "r", ip: "ip", startedAt: 0, durationMs: () => 12 };
    recordQualityCountMock.mockResolvedValue(undefined);
    recordQualityLatencyMock.mockResolvedValue(undefined);

    const jsonRes = await handleModelJsonError("MODEL_NO_JSON", {
      ctx,
      countMetric: "m1",
      latencyMetric: "m2",
      message: "bad",
    });
    expect(jsonRes?.status).toBe(502);

    const textRes = await handleModelTextError("MODEL_NO_TEXT", {
      ctx,
      countMetric: "m1",
      latencyMetric: "m2",
      message: "bad",
      status: 503,
    });
    expect(textRes?.status).toBe(503);

    const jsonRes2 = await handleModelJsonError("MODEL_INVALID_JSON", {
      ctx,
      countMetric: "m1",
      latencyMetric: "m2",
      message: "bad",
      status: 504,
    });
    expect(jsonRes2?.status).toBe(504);

    const textRes2 = await handleModelTextError("MODEL_NO_TEXT", {
      ctx,
      countMetric: "m1",
      latencyMetric: "m2",
      message: "bad",
    });
    expect(textRes2?.status).toBe(502);
  });

  it("returns null for non-matching model errors", async () => {
    const ctx = { requestId: "r", ip: "ip", startedAt: 0, durationMs: () => 12 };
    await expect(
      handleModelJsonError("OTHER", { ctx, countMetric: "m1", latencyMetric: "m2", message: "bad" })
    ).resolves.toBeNull();
    await expect(
      handleModelTextError("OTHER", { ctx, countMetric: "m1", latencyMetric: "m2", message: "bad" })
    ).resolves.toBeNull();
  });

  it("controls api logging via env", () => {
    const originalEnv = { ...process.env };
    process.env.NODE_ENV = "test";
    process.env.API_LOGS = "1";
    expect(shouldLogApi()).toBe(false);

    process.env.NODE_ENV = "production";
    process.env.API_LOGS = "0";
    expect(shouldLogApi()).toBe(false);

    process.env.API_LOGS = "1";
    expect(shouldLogApi()).toBe(true);
    process.env = originalEnv;
  });
});
