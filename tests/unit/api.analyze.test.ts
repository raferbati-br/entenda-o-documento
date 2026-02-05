import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAnalyzeDocument = vi.fn();
const mockCleanupMemoryStore = vi.fn();
const mockGetCapture = vi.fn();
const mockDeleteCapture = vi.fn();
const mockIsRedisRequiredAndMissing = vi.fn();
const mockEvaluateOcrText = vi.fn();
const mockRecordQualityCount = vi.fn((name: string) => Promise.resolve(name));
const mockRecordQualityLatency = vi.fn((name: string, ms: number) => Promise.resolve([name, ms]));
const mockBadRequest = vi.fn((msg: string, status?: number) => ({ error: msg, status: status ?? 400 }));
const mockCreateRouteContext = vi.fn(() => ({ requestId: "r", ip: "ip", durationMs: () => 12 }));
const mockHandleApiKeyError = vi.fn();
const mockHandleModelJsonError = vi.fn();
const mockReadJsonRecord = vi.fn();
const mockRunCommonGuards = vi.fn();
const mockSafeRecordMetrics = vi.fn();

vi.mock("@/ai/analyzeDocument", () => ({
  analyzeDocument: (...args: unknown[]) => mockAnalyzeDocument(...args),
}));
vi.mock("@/lib/captureStoreServer", () => ({
  cleanupMemoryStore: () => mockCleanupMemoryStore(),
  getCapture: (...args: unknown[]) => mockGetCapture(...args),
  deleteCapture: (...args: unknown[]) => mockDeleteCapture(...args),
  isRedisRequiredAndMissing: () => mockIsRedisRequiredAndMissing(),
}));
vi.mock("@/lib/ocrTextQuality", () => ({
  evaluateOcrText: (...args: unknown[]) => mockEvaluateOcrText(...args),
}));
vi.mock("@/lib/qualityMetrics", () => ({
  recordQualityCount: (...args: unknown[]) => mockRecordQualityCount(...args),
  recordQualityLatency: (...args: unknown[]) => mockRecordQualityLatency(...args),
}));
vi.mock("@/lib/apiRouteUtils", () => ({
  badRequest: (...args: unknown[]) => mockBadRequest(...args),
  createRouteContext: (...args: unknown[]) => mockCreateRouteContext(...args),
  handleApiKeyError: (...args: unknown[]) => mockHandleApiKeyError(...args),
  handleModelJsonError: (...args: unknown[]) => mockHandleModelJsonError(...args),
  readJsonRecord: (...args: unknown[]) => mockReadJsonRecord(...args),
  runCommonGuards: (...args: unknown[]) => mockRunCommonGuards(...args),
  safeRecordMetrics: (...args: unknown[]) => mockSafeRecordMetrics(...args),
  shouldLogApi: () => false,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

import { POST } from "@/app/api/analyze/route";

describe("api/analyze", () => {
  beforeEach(() => {
    mockAnalyzeDocument.mockReset();
    mockCleanupMemoryStore.mockReset();
    mockGetCapture.mockReset();
    mockDeleteCapture.mockReset();
    mockIsRedisRequiredAndMissing.mockReset();
    mockEvaluateOcrText.mockReset();
    mockBadRequest.mockReset();
    mockHandleApiKeyError.mockReset();
    mockHandleModelJsonError.mockReset();
    mockReadJsonRecord.mockReset();
    mockRunCommonGuards.mockReset();
    mockSafeRecordMetrics.mockReset();
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

  it("returns bad request for missing body", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(false);
    mockReadJsonRecord.mockResolvedValue(null);

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Requisicao invalida.", status: 400 });
  });

  it("returns error when image missing", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(false);
    mockReadJsonRecord.mockResolvedValue({ captureId: "c1" });
    mockGetCapture.mockResolvedValue({ imageBase64: "" });

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Imagem não encontrada ou inválida (capture expirou)", status: 404 });
  });

  it("analyzes with image and returns result", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(false);
    mockReadJsonRecord.mockResolvedValue({ captureId: "c1", attempt: 2 });
    mockGetCapture.mockResolvedValue({ imageBase64: "data:image/png;base64,abc" });
    mockAnalyzeDocument.mockResolvedValue({
      result: { confidence: 0.8, cards: [], notice: "ok" },
      meta: { provider: "p", model: "m" },
      promptId: "pid",
      stats: { sanitizerApplied: false, confidenceLow: false },
    });

    const res = await POST(new Request("http://test"));

    expect(mockAnalyzeDocument).toHaveBeenCalled();
    expect(res.body).toEqual({ ok: true, result: { confidence: 0.8, cards: [], notice: "ok" } });
  });
});
