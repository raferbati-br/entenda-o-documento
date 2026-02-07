jest.mock("@/ai/llmContext", () => ({
  buildLlmContext: jest.fn(() => ({ model: "test-model", provider: { answer: jest.fn(), answerStream: jest.fn() } })),
}));

jest.mock("@/lib/promptIds", () => ({
  getQaPromptId: jest.fn(),
}));

jest.mock("@/ai/prompts", () => ({
  getQaPrompt: jest.fn(),
}));

jest.mock("@/lib/text", () => ({
  safeShorten: jest.fn((text: string) => text.slice(0, 420)),
}));

import { answerQuestion, answerQuestionStream } from "@/ai/answerQuestion";
import { buildLlmContext } from "@/ai/llmContext";
import { getQaPromptId } from "@/lib/promptIds";
import { getQaPrompt } from "@/ai/prompts";
import { safeShorten } from "@/lib/text";

const mockAnswer = jest.fn();
const mockAnswerStream = jest.fn();

async function* streamChunks(chunks: string[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

function setupProvider(withStream = true) {
  jest.mocked(buildLlmContext).mockReturnValue({
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
    jest.mocked(getQaPromptId).mockReset();
    jest.mocked(getQaPrompt).mockReset();
    jest.mocked(safeShorten).mockClear();
  });

  it("renders template and shortens answer", async () => {
    setupProvider(true);
    jest.mocked(getQaPromptId).mockReturnValue("entendaDocumento.qa.v1");
    jest.mocked(getQaPrompt).mockReturnValue({
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
    jest.mocked(getQaPromptId).mockReset();
    jest.mocked(getQaPrompt).mockReset();
  });

  it("uses provider stream when available", async () => {
    setupProvider(true);
    jest.mocked(getQaPromptId).mockReturnValue("entendaDocumento.qa.v1");
    jest.mocked(getQaPrompt).mockReturnValue({
      id: "entendaDocumento.qa.v1",
      system: "sys",
      user: "{{question}}/{{context}}",
      noticeDefault: "",
    });

    mockAnswerStream.mockResolvedValue({ stream: streamChunks(["a", "b"]), meta: { provider: "p", model: "m" } });

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
    jest.mocked(getQaPromptId).mockReturnValue("entendaDocumento.qa.v1");
    jest.mocked(getQaPrompt).mockReturnValue({
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
