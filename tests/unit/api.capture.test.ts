import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCleanupMemoryStore = vi.fn();
const mockIsRedisConfigured = vi.fn();
const mockMemoryStats = vi.fn();
const mockSetCapture = vi.fn();
const mockBadRequest = vi.fn((msg: string, status?: number) => ({ error: msg, status: status ?? 400 }));
const mockCreateRouteContext = vi.fn(() => ({ requestId: "r", ip: "ip", durationMs: () => 7 }));
const mockReadJsonRecord = vi.fn();
const mockRunCommonGuards = vi.fn();

vi.mock("crypto", () => ({
  default: { randomBytes: () => Buffer.from("abcd", "utf-8") },
  randomBytes: () => Buffer.from("abcd", "utf-8"),
}));

vi.mock("@/lib/captureStoreServer", () => ({
  cleanupMemoryStore: () => mockCleanupMemoryStore(),
  isRedisConfigured: () => mockIsRedisConfigured(),
  memoryStats: () => mockMemoryStats(),
  setCapture: (...args: unknown[]) => mockSetCapture(...args),
}));
vi.mock("@/lib/apiRouteUtils", () => ({
  badRequest: (...args: unknown[]) => mockBadRequest(...args),
  createRouteContext: (...args: unknown[]) => mockCreateRouteContext(...args),
  readJsonRecord: (...args: unknown[]) => mockReadJsonRecord(...args),
  runCommonGuards: (...args: unknown[]) => mockRunCommonGuards(...args),
}));
vi.mock("@/lib/dataUrl", () => ({
  parseDataUrl: (value: string) => {
    const match = /^data:([^;]+);base64,(.+)$/.exec(value);
    if (!match) return null;
    return { mimeType: match[1], base64: match[2] };
  },
}));
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

import { POST } from "@/app/api/capture/route";

describe("api/capture", () => {
  beforeEach(() => {
    mockCleanupMemoryStore.mockReset();
    mockIsRedisConfigured.mockReset();
    mockMemoryStats.mockReset();
    mockSetCapture.mockReset();
    mockBadRequest.mockReset();
    mockReadJsonRecord.mockReset();
    mockRunCommonGuards.mockReset();
  });

  it("returns guard error", async () => {
    mockRunCommonGuards.mockResolvedValue({ status: 401 });
    const res = await POST(new Request("http://test"));
    expect(res).toEqual({ status: 401 });
  });

  it("returns bad request when body invalid", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockReadJsonRecord.mockResolvedValue(null);

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Requisicao invalida.", status: 400 });
  });

  it("accepts data url and stores capture", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const payload = Buffer.concat([header, Buffer.alloc(40, 1)]);
    mockReadJsonRecord.mockResolvedValue({ imageBase64: "data:image/png;base64," + payload.toString("base64") });
    mockIsRedisConfigured.mockReturnValue(true);

    const res = await POST(new Request("http://test"));

    expect(res.body.ok).toBe(true);
    expect(mockSetCapture).toHaveBeenCalled();
  });
});
