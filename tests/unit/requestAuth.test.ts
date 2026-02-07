import crypto from "node:crypto";
import { createSessionToken, isOriginAllowed, verifySessionToken } from "@/lib/requestAuth";


describe("requestAuth", () => {
  const realEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...realEnv };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...realEnv };
  });

  it("throws when API_TOKEN_SECRET is missing", () => {
    delete process.env.API_TOKEN_SECRET;
    expect(() => createSessionToken()).toThrow("API_TOKEN_SECRET_NOT_SET");
  });

  it("creates and verifies session token", () => {
    process.env.API_TOKEN_SECRET = "secret";
    jest.spyOn(Date, "now").mockReturnValue(100_000);

    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rejects expired token", () => {
    process.env.API_TOKEN_SECRET = "secret";
    jest.spyOn(Date, "now").mockReturnValue(100_000);
    const token = createSessionToken();

    (Date.now as unknown as { mockReturnValue: (value: number) => void }).mockReturnValue(500_000);
    expect(verifySessionToken(token)).toBe(false);
  });

  it("rejects invalid or malformed tokens", () => {
    process.env.API_TOKEN_SECRET = "secret";

    expect(verifySessionToken("")).toBe(false);
    expect(verifySessionToken("onlypayload")).toBe(false);

    const badPayload = Buffer.from("{not-json", "utf8").toString("base64url");
    const badSig = crypto.createHmac("sha256", "secret").update(badPayload).digest("base64url");
    expect(verifySessionToken(`${badPayload}.${badSig}`)).toBe(false);
  });

  it("returns false when secret is missing", () => {
    delete process.env.API_TOKEN_SECRET;
    expect(verifySessionToken("a.b")).toBe(false);
  });

  it("rejects token with invalid signature", () => {
    process.env.API_TOKEN_SECRET = "secret";
    jest.spyOn(Date, "now").mockReturnValue(100_000);

    const token = createSessionToken();
    const [payload, sig] = token.split(".");
    const tampered = `${sig.slice(0, -1)}${sig.slice(-1) === "a" ? "b" : "a"}`;
    expect(verifySessionToken(`${payload}.${tampered}`)).toBe(false);
  });

  it("rejects token with non-numeric exp", () => {
    process.env.API_TOKEN_SECRET = "secret";
    const payload = Buffer.from(JSON.stringify({ exp: "nope" }), "utf8").toString("base64url");
    const sig = crypto.createHmac("sha256", "secret").update(payload).digest("base64url");
    expect(verifySessionToken(`${payload}.${sig}`)).toBe(false);
  });

  it("rejects token when exp is missing", () => {
    process.env.API_TOKEN_SECRET = "secret";
    const payload = Buffer.from(JSON.stringify({}), "utf8").toString("base64url");
    const sig = crypto.createHmac("sha256", "secret").update(payload).digest("base64url");
    expect(verifySessionToken(`${payload}.${sig}`)).toBe(false);
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

    const req2 = new Request("http://127.0.0.1:3000/api", { headers: { origin: "http://127.0.0.1:3000" } });
    expect(isOriginAllowed(req2)).toBe(true);
  });

  it("rejects when origin header is missing in dev mode", () => {
    delete process.env.APP_ORIGIN;
    const req = new Request("http://localhost:3000/api");
    expect(isOriginAllowed(req)).toBe(false);
  });

  it("rejects disallowed origin and invalid referer", () => {
    process.env.APP_ORIGIN = "https://example.com";
    const req = new Request("https://example.com/api", { headers: { origin: "https://other.com" } });
    expect(isOriginAllowed(req)).toBe(false);

    const req2 = new Request("https://example.com/api", { headers: { referer: "not-a-url" } });
    expect(isOriginAllowed(req2)).toBe(false);
  });
});
