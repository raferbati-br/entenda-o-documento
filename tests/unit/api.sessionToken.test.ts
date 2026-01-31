import { describe, expect, it, vi, beforeEach } from "vitest";

const mockRunCommonGuards = vi.fn();
const mockCreateRouteContext = vi.fn(() => ({ requestId: "r", ip: "ip", durationMs: () => 5 }));
const mockBadRequest = vi.fn((msg: string, status?: number) => ({ error: msg, status: status ?? 400 }));
const mockHandleTokenSecretError = vi.fn();

vi.mock("@/lib/apiRouteUtils", () => ({
  runCommonGuards: (...args: unknown[]) => mockRunCommonGuards(...args),
  createRouteContext: (...args: unknown[]) => mockCreateRouteContext(...args),
  badRequest: (...args: unknown[]) => mockBadRequest(...args),
  handleTokenSecretError: (...args: unknown[]) => mockHandleTokenSecretError(...args),
}));

const mockCreateSessionToken = vi.fn();
vi.mock("@/lib/requestAuth", () => ({
  createSessionToken: () => mockCreateSessionToken(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body,
      status: init?.status ?? 200,
      headers: init?.headers ?? {},
    }),
  },
}));

import { GET } from "@/app/api/session-token/route";

describe("api/session-token", () => {
  beforeEach(() => {
    mockRunCommonGuards.mockReset();
    mockCreateSessionToken.mockReset();
    mockBadRequest.mockReset();
    mockHandleTokenSecretError.mockReset();
  });

  it("returns guard error when blocked", async () => {
    mockRunCommonGuards.mockResolvedValue({ status: 401 });
    const res = await GET(new Request("http://test"));
    expect(res).toEqual({ status: 401 });
  });

  it("returns token when successful", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockCreateSessionToken.mockReturnValue("token-1");

    const res = await GET(new Request("http://test"));

    expect(res.body).toEqual({ ok: true, token: "token-1" });
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("handles secret error", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockCreateSessionToken.mockImplementation(() => {
      throw new Error("TOKEN_SECRET_MISSING");
    });
    mockHandleTokenSecretError.mockReturnValue({ status: 500 });

    const res = await GET(new Request("http://test"));

    expect(res).toEqual({ status: 500 });
  });

  it("returns badRequest on unknown error", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockCreateSessionToken.mockImplementation(() => {
      throw new Error("OTHER");
    });
    mockHandleTokenSecretError.mockReturnValue(null);

    const res = await GET(new Request("http://test"));

    expect(res).toEqual({ error: "Erro ao gerar token", status: 500 });
  });
});
