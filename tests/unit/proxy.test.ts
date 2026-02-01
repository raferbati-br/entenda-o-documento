/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const nextMock = vi.fn();

vi.mock("next/server", () => ({
  NextResponse: {
    next: (...args: unknown[]) => nextMock(...args),
  },
}));

import { proxy } from "@/proxy";


describe("proxy", () => {
  const realEnv = { ...process.env };
  beforeEach(() => {
    process.env = { ...realEnv };
    nextMock.mockReset();
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i += 1) arr[i] = i + 1;
      return arr;
    });
  });

  afterEach(() => {
    process.env = { ...realEnv };
    vi.restoreAllMocks();
  });

  it("adds CSP header in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.DISABLE_CSP;

    nextMock.mockImplementation((options: { request?: { headers?: Headers } }) => {
      return { headers: new Headers(), request: options.request };
    });

    const req = new Request("https://example.com", { headers: { "x-test": "1" } });
    const res = proxy(req as unknown as import("next/server").NextRequest) as { headers: Headers };

    expect(res.headers.get("Content-Security-Policy")).toContain("script-src 'self' 'nonce-");
  });

  it("skips CSP in dev or when disabled", () => {
    process.env.NODE_ENV = "development";
    process.env.DISABLE_CSP = "1";

    nextMock.mockImplementation((options: { request?: { headers?: Headers } }) => {
      return { headers: new Headers(), request: options.request };
    });

    const req = new Request("https://example.com");
    const res = proxy(req as unknown as import("next/server").NextRequest) as { headers: Headers };

    expect(res.headers.get("Content-Security-Policy")).toBeNull();
  });
});
