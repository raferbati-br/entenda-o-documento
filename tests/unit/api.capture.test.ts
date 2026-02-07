const mockCleanupMemoryStore = jest.fn();
const mockIsRedisConfigured = jest.fn();
const mockIsRedisRequiredAndMissing = jest.fn();
const mockMemoryStats = jest.fn();
const mockSetCapture = jest.fn();
const mockBadRequest = jest.fn((msg: string, status?: number) => ({ error: msg, status: status ?? 400 }));
const mockCreateRouteContext = jest.fn(() => ({ requestId: "r", ip: "ip", durationMs: () => 7 }));
const mockReadJsonRecord = jest.fn();
const mockRunCommonGuards = jest.fn();

jest.mock("crypto", () => ({
  default: { randomBytes: () => Buffer.from("abcd", "utf-8") },
  randomBytes: () => Buffer.from("abcd", "utf-8"),
}));

jest.mock("@/lib/captureStoreServer", () => ({
  cleanupMemoryStore: () => mockCleanupMemoryStore(),
  isRedisConfigured: () => mockIsRedisConfigured(),
  isRedisRequiredAndMissing: () => mockIsRedisRequiredAndMissing(),
  memoryStats: () => mockMemoryStats(),
  setCapture: (...args: unknown[]) => mockSetCapture(...args),
}));
jest.mock("@/lib/apiRouteUtils", () => ({
  badRequest: (...args: unknown[]) => mockBadRequest(...args),
  createRouteContext: (...args: unknown[]) => mockCreateRouteContext(...args),
  readJsonRecord: (...args: unknown[]) => mockReadJsonRecord(...args),
  runCommonGuards: (...args: unknown[]) => mockRunCommonGuards(...args),
  shouldLogApi: () => false,
}));
jest.mock("@/lib/dataUrl", () => ({
  parseDataUrl: (value: string) => {
    const match = /^data:([^;]+);base64,(.+)$/.exec(value);
    if (!match) return null;
    return { mimeType: match[1], base64: match[2] };
  },
}));
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

import { POST } from "@/app/api/capture/route";

describe("api/capture", () => {
  beforeEach(() => {
    mockCleanupMemoryStore.mockReset();
    mockIsRedisConfigured.mockReset();
    mockIsRedisRequiredAndMissing.mockReset();
    mockMemoryStats.mockReset();
    mockSetCapture.mockReset();
    mockBadRequest.mockClear();
    mockReadJsonRecord.mockReset();
    mockRunCommonGuards.mockReset();
  });

  it("returns guard error", async () => {
    mockRunCommonGuards.mockResolvedValue({ status: 401 });
    const res = await POST(new Request("http://test"));
    expect(res).toEqual({ status: 401 });
  });

  it("blocks when redis is required in production", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(true);

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Redis nao configurado para producao.", status: 503 });
  });

  it("returns bad request when body invalid", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(false);
    mockReadJsonRecord.mockResolvedValue(null);

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Requisicao invalida.", status: 400 });
  });

  it("accepts data url and stores capture", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(false);
    const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const payload = Buffer.concat([header, Buffer.alloc(40, 1)]);
    mockReadJsonRecord.mockResolvedValue({ imageBase64: "data:image/png;base64," + payload.toString("base64") });
    mockIsRedisConfigured.mockReturnValue(true);

    const res = await POST(new Request("http://test"));

    expect(res.body.ok).toBe(true);
    expect(mockSetCapture).toHaveBeenCalled();
  });
});
