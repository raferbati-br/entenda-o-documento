const mockAnswerQuestionStream = jest.fn();
const mockRecordQualityCount = jest.fn((name: string) => Promise.resolve(name));
const mockRecordQualityLatency = jest.fn((name: string, ms: number) => Promise.resolve([name, ms]));
const mockSerializeQaStreamEvent = jest.fn((event: unknown) => JSON.stringify(event) + "\n");
const mockBadRequest = jest.fn((msg: string, status?: number) => ({ error: msg, status: status ?? 400 }));
const mockCreateRouteContext = jest.fn(() => ({ requestId: "r", ip: "ip", durationMs: () => 11 }));
const mockHandleApiKeyError = jest.fn();
const mockHandleModelTextError = jest.fn();
const mockReadJsonRecord = jest.fn();
const mockRunCommonGuards = jest.fn();
const mockSafeRecordMetrics = jest.fn();

jest.mock("@/ai/answerQuestion", () => ({
  answerQuestionStream: (...args: unknown[]) => mockAnswerQuestionStream(...args),
}));
jest.mock("@/lib/qualityMetrics", () => ({
  recordQualityCount: (...args: unknown[]) => mockRecordQualityCount(...args),
  recordQualityLatency: (...args: unknown[]) => mockRecordQualityLatency(...args),
}));
jest.mock("@/lib/qaStream", () => ({
  serializeQaStreamEvent: (...args: unknown[]) => mockSerializeQaStreamEvent(...args),
}));
jest.mock("@/lib/apiRouteUtils", () => ({
  badRequest: (...args: unknown[]) => mockBadRequest(...args),
  createRouteContext: (...args: unknown[]) => mockCreateRouteContext(...args),
  handleApiKeyError: (...args: unknown[]) => mockHandleApiKeyError(...args),
  handleModelTextError: (...args: unknown[]) => mockHandleModelTextError(...args),
  readJsonRecord: (...args: unknown[]) => mockReadJsonRecord(...args),
  runCommonGuards: (...args: unknown[]) => mockRunCommonGuards(...args),
  safeRecordMetrics: (...args: unknown[]) => mockSafeRecordMetrics(...args),
  shouldLogApi: () => false,
}));

jest.mock("next/server", () => {
  class FakeNextResponse {
    body: ReadableStream;
    status: number;
    headers: Record<string, string>;
    constructor(body: ReadableStream, init: { status?: number; headers?: Record<string, string> } = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.headers = init.headers ?? {};
    }
    static json(body: unknown, init?: { status?: number }) {
      return { body, status: init?.status ?? 200 };
    }
  }
  return { NextResponse: FakeNextResponse };
});

import { POST } from "@/app/api/qa/route";

async function readStream(stream: ReadableStream) {
  const reader = stream.getReader();
  const chunks: string[] = [];
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value));
  }
  return chunks.join("");
}

async function* streamSingleChunk(value: string) {
  yield value;
}

describe("api/qa", () => {
  beforeEach(() => {
    mockAnswerQuestionStream.mockReset();
    mockBadRequest.mockClear();
    mockHandleApiKeyError.mockReset();
    mockHandleModelTextError.mockReset();
    mockReadJsonRecord.mockReset();
    mockRunCommonGuards.mockReset();
    mockSafeRecordMetrics.mockReset();
    mockSerializeQaStreamEvent.mockClear();
  });

  it("validates input", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockReadJsonRecord.mockResolvedValue({ question: "a", context: "" });

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Pergunta muito curta", status: 400 });
  });

  it("streams answer and closes", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockReadJsonRecord.mockResolvedValue({ question: "pergunta", context: "contexto" });

    mockAnswerQuestionStream.mockResolvedValue({
      stream: streamSingleChunk("ola"),
      meta: { provider: "p", model: "m" },
      promptId: "pid",
    });

    const res = await POST(new Request("http://test"));
    const text = await readStream(res.body);

    expect(res.status).toBe(200);
    expect(text).toContain("delta");
    expect(text).toContain("done");
  });

  it("returns error event when model yields empty text", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockReadJsonRecord.mockResolvedValue({ question: "pergunta", context: "contexto" });

    mockAnswerQuestionStream.mockResolvedValue({
      stream: streamSingleChunk(""),
      meta: { provider: "p", model: "m" },
      promptId: "pid",
    });

    const res = await POST(new Request("http://test"));
    const text = await readStream(res.body);

    expect(text).toContain("error");
  });
});
