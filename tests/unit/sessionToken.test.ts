/** @jest-environment jsdom */
import { stubGlobal, unstubAllGlobals } from "./jestGlobals";
import { clearSessionToken, ensureSessionToken, getSessionToken } from "@/lib/sessionToken";

function mockFetch(status: number, data: unknown) {
  stubGlobal("fetch", jest.fn(async () => ({
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

  it("returns null when response json throws", async () => {
    stubGlobal("fetch", jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("boom");
      },
    } as Response)));
    const token = await ensureSessionToken();
    expect(token).toBeNull();
  });

  it("returns cached token without calling api", async () => {
    sessionStorage.setItem("eod_session_token_v1", "cached");
    const fetchSpy = jest.fn();
    stubGlobal("fetch", fetchSpy);
    const token = await ensureSessionToken();
    expect(token).toBe("cached");
    expect(fetchSpy).not.toHaveBeenCalled();
    unstubAllGlobals();
  });

  it("returns null when window is not available", async () => {
    const originalWindow = globalThis.window;
    stubGlobal("window", undefined as unknown as Window);

    await expect(getSessionToken()).resolves.toBeNull();
    await expect(ensureSessionToken()).resolves.toBeNull();
    await expect(clearSessionToken()).resolves.toBeUndefined();

    stubGlobal("window", originalWindow);
  });
});
