import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createSessionToken, isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";


describe("requestAuth", () => {
  const realEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...realEnv };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...realEnv };
  });

  it("throws when API_TOKEN_SECRET is missing", () => {
    delete process.env.API_TOKEN_SECRET;
    expect(() => createSessionToken()).toThrowError("API_TOKEN_SECRET_NOT_SET");
  });

  it("creates and verifies session token", () => {
    process.env.API_TOKEN_SECRET = "secret";
    vi.spyOn(Date, "now").mockReturnValue(100_000);

    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rejects expired token", () => {
    process.env.API_TOKEN_SECRET = "secret";
    vi.spyOn(Date, "now").mockReturnValue(100_000);
    const token = createSessionToken();

    (Date.now as unknown as { mockReturnValue: (value: number) => void }).mockReturnValue(500_000);
    expect(verifySessionToken(token)).toBe(false);
  });

  it("validates origin with configured APP_ORIGIN", () => {
    process.env.APP_ORIGIN = "https://example.com";
    const req = new Request("https://example.com/api", { headers: { origin: "https://example.com" } });
    expect(isOriginAllowed(req)).toBe(true);

    const req2 = new Request("https://example.com/api", { headers: { referer: "https://example.com/x" } });
    expect(isOriginAllowed(req2)).toBe(true);
  });

  it("allows localhost when APP_ORIGIN is not set", () => {
    delete process.env.APP_ORIGIN;
    const req = new Request("http://localhost:3000/api", { headers: { origin: "http://localhost:3000" } });
    expect(isOriginAllowed(req)).toBe(true);
  });
});
