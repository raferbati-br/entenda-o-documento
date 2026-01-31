import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAnswerQuestionStream = vi.fn();
const mockRecordQualityCount = vi.fn((name: string) => Promise.resolve(name));
const mockRecordQualityLatency = vi.fn((name: string, ms: number) => Promise.resolve([name, ms]));
const mockSerializeQaStreamEvent = vi.fn((event: unknown) => JSON.stringify(event) + "\n");
const mockBadRequest = vi.fn((msg: string, status?: number) => ({ error: msg, status: status ?? 400 }));
const mockCreateRouteContext = vi.fn(() => ({ requestId: "r", ip: "ip", durationMs: () => 11 }));
const mockHandleApiKeyError = vi.fn();
const mockHandleModelTextError = vi.fn();
const mockReadJsonRecord = vi.fn();
const mockRunCommonGuards = vi.fn();
const mockSafeRecordMetrics = vi.fn();

vi.mock("@/ai/answerQuestion", () => ({
  answerQuestionStream: (...args: unknown[]) => mockAnswerQuestionStream(...args),
}));
vi.mock("@/lib/qualityMetrics", () => ({
  recordQualityCount: (...args: unknown[]) => mockRecordQualityCount(...args),
  recordQualityLatency: (...args: unknown[]) => mockRecordQualityLatency(...args),
}));
vi.mock("@/lib/qaStream", () => ({
  serializeQaStreamEvent: (...args: unknown[]) => mockSerializeQaStreamEvent(...args),
}));
vi.mock("@/lib/apiRouteUtils", () => ({
  badRequest: (...args: unknown[]) => mockBadRequest(...args),
  createRouteContext: (...args: unknown[]) => mockCreateRouteContext(...args),
  handleApiKeyError: (...args: unknown[]) => mockHandleApiKeyError(...args),
  handleModelTextError: (...args: unknown[]) => mockHandleModelTextError(...args),
  readJsonRecord: (...args: unknown[]) => mockReadJsonRecord(...args),
  runCommonGuards: (...args: unknown[]) => mockRunCommonGuards(...args),
  safeRecordMetrics: (...args: unknown[]) => mockSafeRecordMetrics(...args),
}));

vi.mock("next/server", () => {
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
    mockBadRequest.mockReset();
    mockHandleApiKeyError.mockReset();
    mockHandleModelTextError.mockReset();
    mockReadJsonRecord.mockReset();
    mockRunCommonGuards.mockReset();
    mockSafeRecordMetrics.mockReset();
    mockSerializeQaStreamEvent.mockReset();
  });

  it("validates input", async () => {
    mockRunCommonGuards.mockResolvedValue(null);
    mockReadJsonRecord.mockResolvedValue({ question: "a", context: "" });

    const res = await POST(new Request("http://test"));

    expect(res).toEqual({ error: "Pergunta muito curta.", status: 400 });
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
