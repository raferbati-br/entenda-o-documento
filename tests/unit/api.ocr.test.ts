const mockExtractDocumentText = jest.fn();
const mockGetCapture = jest.fn();
const mockIsRedisRequiredAndMissing = jest.fn();
const mockRecordQualityCount = jest.fn((name: string) => Promise.resolve(name));
const mockRecordQualityLatency = jest.fn((name: string, ms: number) => Promise.resolve([name, ms]));
const mockBadRequest = jest.fn((msg: string, status?: number) => ({ error: msg, status: status ?? 400 }));
const mockCreateRouteContext = jest.fn(() => ({ requestId: "r", ip: "ip", durationMs: () => 9 }));
const mockHandleApiKeyError = jest.fn();
const mockHandleModelJsonError = jest.fn();
const mockReadJsonRecord = jest.fn();
const mockRunCommonGuards = jest.fn();
const mockSafeRecordMetrics = jest.fn();

jest.mock("@/ai/extractDocumentText", () => ({
  extractDocumentText: (...args: unknown[]) => mockExtractDocumentText(...args),
}));
jest.mock("@/lib/captureStoreServer", () => ({
  getCapture: (...args: unknown[]) => mockGetCapture(...args),
  isRedisRequiredAndMissing: () => mockIsRedisRequiredAndMissing(),
}));
jest.mock("@/lib/qualityMetrics", () => ({
  recordQualityCount: (...args: unknown[]) => mockRecordQualityCount(...args),
  recordQualityLatency: (...args: unknown[]) => mockRecordQualityLatency(...args),
}));
jest.mock("@/lib/apiRouteUtils", () => ({
  badRequest: (...args: unknown[]) => mockBadRequest(...args),
  createRouteContext: (...args: unknown[]) => mockCreateRouteContext(...args),
  handleApiKeyError: (...args: unknown[]) => mockHandleApiKeyError(...args),
  handleModelJsonError: (...args: unknown[]) => mockHandleModelJsonError(...args),
  readJsonRecord: (...args: unknown[]) => mockReadJsonRecord(...args),
  runCommonGuards: (...args: unknown[]) => mockRunCommonGuards(...args),
  safeRecordMetrics: (...args: unknown[]) => mockSafeRecordMetrics(...args),
  shouldLogApi: () => false,
}));
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

import { POST } from "@/app/api/ocr/route";

describe("api/ocr", () => {
  beforeEach(() => {
    mockExtractDocumentText.mockReset();
    mockGetCapture.mockReset();
    mockIsRedisRequiredAndMissing.mockReset();
    mockBadRequest.mockClear();
    mockHandleApiKeyError.mockReset();
    mockHandleModelJsonError.mockReset();
    mockReadJsonRecord.mockReset();
    mockRunCommonGuards.mockReset();
    mockSafeRecordMetrics.mockReset();
  });

  it("validates captureId", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(false);
    mockReadJsonRecord.mockResolvedValue({});

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "CaptureId nao informado.", status: 400 });
  });

  it("returns error when image missing", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(false);
    mockReadJsonRecord.mockResolvedValue({ captureId: "c1" });
    mockGetCapture.mockResolvedValue({});

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Imagem não encontrada ou inválida (capture expirou)", status: 404 });
  });

  it("extracts text and returns ok", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(false);
    mockReadJsonRecord.mockResolvedValue({ captureId: "c1" });
    mockGetCapture.mockResolvedValue({ imageBase64: "data:image/png;base64,abc" });
    mockExtractDocumentText.mockResolvedValue({
      documentText: "texto",
      meta: { provider: "p", model: "m" },
      promptId: "pid",
    });

    const res = await POST(new Request("http://test"));

    expect(res.body).toEqual({ ok: true, documentText: "texto" });
  });

  it("blocks when redis is required in production", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockIsRedisRequiredAndMissing.mockReturnValue(true);

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Redis nao configurado para producao.", status: 503 });
  });
});
