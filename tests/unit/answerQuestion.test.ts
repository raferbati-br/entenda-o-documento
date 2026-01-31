import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/ai/llmContext", () => ({
  buildLlmContext: vi.fn(() => ({ model: "test-model", provider: { answer: vi.fn(), answerStream: vi.fn() } })),
}));

vi.mock("@/lib/promptIds", () => ({
  getQaPromptId: vi.fn(),
}));

vi.mock("@/ai/prompts", () => ({
  getQaPrompt: vi.fn(),
}));

vi.mock("@/lib/text", () => ({
  safeShorten: vi.fn((text: string) => text.slice(0, 420)),
}));

import { answerQuestion, answerQuestionStream } from "@/ai/answerQuestion";
import { buildLlmContext } from "@/ai/llmContext";
import { getQaPromptId } from "@/lib/promptIds";
import { getQaPrompt } from "@/ai/prompts";
import { safeShorten } from "@/lib/text";

const mockAnswer = vi.fn();
const mockAnswerStream = vi.fn();

function setupProvider(withStream = true) {
  vi.mocked(buildLlmContext).mockReturnValue({
    model: "test-model",
    provider: {
      answer: mockAnswer,
      answerStream: withStream ? mockAnswerStream : undefined,
    },
  });
}

describe("answerQuestion", () => {
  beforeEach(() => {
    mockAnswer.mockReset();
    mockAnswerStream.mockReset();
    vi.mocked(getQaPromptId).mockReset();
    vi.mocked(getQaPrompt).mockReset();
    vi.mocked(safeShorten).mockClear();
  });

  it("renders template and shortens answer", async () => {
    setupProvider(true);
    vi.mocked(getQaPromptId).mockReturnValue("entendaDocumento.qa.v1");
    vi.mocked(getQaPrompt).mockReturnValue({
      id: "entendaDocumento.qa.v1",
      system: "sys",
      user: "Q: {{question}} | C: {{context}}",
      noticeDefault: "",
    });
    mockAnswer.mockResolvedValue({ text: "resposta longa", meta: { provider: "p", model: "m" } });

    const out = await answerQuestion({ question: "pergunta", context: "contexto" });

    expect(mockAnswer).toHaveBeenCalledWith({
      model: "test-model",
      prompt: { id: "entendaDocumento.qa.v1", system: "sys", user: "Q: pergunta | C: contexto", noticeDefault: "" },
    });
    expect(safeShorten).toHaveBeenCalledWith("resposta longa", 420);
    expect(out).toEqual({
      answer: "resposta longa",
      meta: { provider: "p", model: "m" },
      promptId: "entendaDocumento.qa.v1",
    });
  });
});

describe("answerQuestionStream", () => {
  beforeEach(() => {
    mockAnswer.mockReset();
    mockAnswerStream.mockReset();
    vi.mocked(getQaPromptId).mockReset();
    vi.mocked(getQaPrompt).mockReset();
  });

  it("uses provider stream when available", async () => {
    setupProvider(true);
    vi.mocked(getQaPromptId).mockReturnValue("entendaDocumento.qa.v1");
    vi.mocked(getQaPrompt).mockReturnValue({
      id: "entendaDocumento.qa.v1",
      system: "sys",
      user: "{{question}}/{{context}}",
      noticeDefault: "",
    });

    async function* stream() {
      yield "a";
      yield "b";
    }

    mockAnswerStream.mockResolvedValue({ stream: stream(), meta: { provider: "p", model: "m" } });

    const out = await answerQuestionStream({ question: "q", context: "c" });

    expect(mockAnswerStream).toHaveBeenCalledWith({
      model: "test-model",
      prompt: { id: "entendaDocumento.qa.v1", system: "sys", user: "q/c", noticeDefault: "" },
    });
    expect(out.promptId).toBe("entendaDocumento.qa.v1");
    const chunks: string[] = [];
    for await (const chunk of out.stream) chunks.push(chunk);
    expect(chunks).toEqual(["a", "b"]);
  });

  it("falls back to answer when stream is not available", async () => {
    setupProvider(false);
    vi.mocked(getQaPromptId).mockReturnValue("entendaDocumento.qa.v1");
    vi.mocked(getQaPrompt).mockReturnValue({
      id: "entendaDocumento.qa.v1",
      system: "sys",
      user: "{{question}}/{{context}}",
      noticeDefault: "",
    });
    mockAnswer.mockResolvedValue({ text: "texto", meta: { provider: "p", model: "m" } });

    const out = await answerQuestionStream({ question: "q", context: "c" });

    expect(mockAnswer).toHaveBeenCalled();
    const chunks: string[] = [];
    for await (const chunk of out.stream) chunks.push(chunk);
    expect(chunks).toEqual(["texto"]);
  });
});
