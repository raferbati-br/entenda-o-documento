import { describe, expect, it, vi, beforeEach } from "vitest";

const mockEnsureSessionToken = vi.fn();
const mockClearSessionToken = vi.fn();

vi.mock("@/lib/sessionToken", () => ({
  ensureSessionToken: () => mockEnsureSessionToken(),
  clearSessionToken: () => mockClearSessionToken(),
}));

import { postJsonWithSession, postJsonWithSessionResponse } from "@/lib/apiClient";

function mockFetch(response: { status?: number; json?: () => Promise<unknown> }) {
  const res = {
    status: response.status ?? 200,
    json: response.json ?? (async () => ({})),
  } as Response;
  vi.stubGlobal("fetch", vi.fn(async () => res));
  return res;
}

describe("apiClient", () => {
  beforeEach(() => {
    mockEnsureSessionToken.mockReset();
    mockClearSessionToken.mockReset();
  });

  it("adds session token header and parses json", async () => {
    mockEnsureSessionToken.mockResolvedValue("token-1");
    mockFetch({ status: 200, json: async () => ({ ok: true }) });

    const { res, data } = await postJsonWithSession<{ ok: boolean }>("/api/x", { a: 1 });

    expect(res.status).toBe(200);
    expect(data).toEqual({ ok: true });
    const fetchCall = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toBe("/api/x");
    expect(fetchCall[1].headers["x-session-token"]).toBe("token-1");
  });

  it("clears session token on 401", async () => {
    mockEnsureSessionToken.mockResolvedValue("token-2");
    mockFetch({ status: 401, json: async () => ({}) });

    await postJsonWithSession("/api/x", {});

    expect(mockClearSessionToken).toHaveBeenCalledTimes(1);
  });

  it("returns response without parsing for postJsonWithSessionResponse", async () => {
    mockEnsureSessionToken.mockResolvedValue(null);
    const res = mockFetch({ status: 200, json: async () => ({ ok: true }) });

    const out = await postJsonWithSessionResponse("/api/x", { a: 1 });

    expect(out).toBe(res);
  });
});
