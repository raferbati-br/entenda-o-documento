/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { clearSessionToken, ensureSessionToken, getSessionToken } from "@/lib/sessionToken";

function mockFetch(status: number, data: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response)));
}

describe("sessionToken", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("gets and clears token", async () => {
    sessionStorage.setItem("eod_session_token_v1", "abc");
    await expect(getSessionToken()).resolves.toBe("abc");
    await clearSessionToken();
    await expect(getSessionToken()).resolves.toBeNull();
  });

  it("fetches and stores token when missing", async () => {
    mockFetch(200, { ok: true, token: "t1" });
    const token = await ensureSessionToken();
    expect(token).toBe("t1");
    expect(sessionStorage.getItem("eod_session_token_v1")).toBe("t1");
  });

  it("returns null when response invalid", async () => {
    mockFetch(500, { ok: false });
    const token = await ensureSessionToken();
    expect(token).toBeNull();
  });
});
