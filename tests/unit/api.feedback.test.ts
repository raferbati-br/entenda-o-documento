let redisIncrCalls: string[] = [];

jest.mock("@upstash/redis", () => {
  class Redis {
    async incr(key: string) {
      redisIncrCalls.push(key);
      return 1;
    }
  }
  return { Redis };
});

const mockBadRequest = jest.fn((msg: string, status?: number) => ({ error: msg, status: status ?? 400 }));
const mockCreateRouteContext = jest.fn(() => ({ requestId: "r", ip: "ip", durationMs: () => 3 }));
const mockReadJsonRecord = jest.fn();
const mockRunCommonGuards = jest.fn();

jest.mock("@/lib/apiRouteUtils", () => ({
  badRequest: (...args: unknown[]) => mockBadRequest(...args),
  createRouteContext: (...args: unknown[]) => mockCreateRouteContext(...args),
  readJsonRecord: (...args: unknown[]) => mockReadJsonRecord(...args),
  runCommonGuards: (...args: unknown[]) => mockRunCommonGuards(...args),
  shouldLogApi: () => false,
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

import { POST } from "@/app/api/feedback/route";

describe("api/feedback", () => {
  beforeEach(() => {
    redisIncrCalls = [];
    mockBadRequest.mockClear();
    mockReadJsonRecord.mockReset();
    mockRunCommonGuards.mockReset();
    process.env.UPSTASH_REDIS_REST_URL = "https://example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("validates input", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockReadJsonRecord.mockResolvedValue({ helpful: "no" });

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Feedback inválido", status: 400 });
  });

  it("records feedback in redis", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockReadJsonRecord.mockResolvedValue({ helpful: false, reason: "Demorado" });

    const res = await POST(new Request("http://test"));

    expect(res.body).toEqual({ ok: true });
    expect(redisIncrCalls.length).toBeGreaterThan(0);
  });
});
