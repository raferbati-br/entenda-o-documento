jest.mock("@/ai/llmContext", () => ({
  buildLlmContext: jest.fn(() => ({ model: "test-model", provider: { analyze: jest.fn() } })),
}));

jest.mock("@/lib/promptIds", () => ({
  getOcrPromptId: jest.fn(),
}));

jest.mock("@/ai/prompts", () => ({
  getOcrPrompt: jest.fn(),
}));

jest.mock("@/lib/text", () => ({
  redactSensitiveData: jest.fn((text: string) => text.replaceAll(/\d/g, "*")),
  safeShorten: jest.fn((text: string) => text),
}));

import { extractDocumentText } from "@/ai/extractDocumentText";
import { buildLlmContext } from "@/ai/llmContext";
import { getOcrPromptId } from "@/lib/promptIds";
import { getOcrPrompt } from "@/ai/prompts";
import { redactSensitiveData, safeShorten } from "@/lib/text";

const mockAnalyze = jest.fn();

describe("extractDocumentText", () => {
  beforeEach(() => {
    mockAnalyze.mockReset();
    jest.mocked(buildLlmContext).mockReturnValue({ model: "test-model", provider: { analyze: mockAnalyze } });
    jest.mocked(getOcrPromptId).mockReset();
    jest.mocked(getOcrPrompt).mockReset();
    jest.mocked(redactSensitiveData).mockClear();
    jest.mocked(safeShorten).mockClear();
  });

  it("extracts, redacts, and shortens document text", async () => {
    jest.mocked(getOcrPromptId).mockReturnValue("entendaDocumento.ocr.v1");
    jest.mocked(getOcrPrompt).mockReturnValue({
      id: "entendaDocumento.ocr.v1",
      system: "sys",
      user: "user",
      noticeDefault: "",
    });
    mockAnalyze.mockResolvedValue({
      raw: { documentText: "CPF 123" },
      meta: { provider: "p", model: "m" },
    });

    const out = await extractDocumentText("data:image/png;base64,abc");

    expect(mockAnalyze).toHaveBeenCalledWith({
      model: "test-model",
      prompt: { id: "entendaDocumento.ocr.v1", system: "sys", user: "user", noticeDefault: "" },
      imageDataUrl: "data:image/png;base64,abc",
    });
    expect(redactSensitiveData).toHaveBeenCalledWith("CPF 123");
    expect(safeShorten).toHaveBeenCalledWith("CPF ***", 3000);
    expect(out).toEqual({
      documentText: "CPF ***",
      meta: { provider: "p", model: "m" },
      promptId: "entendaDocumento.ocr.v1",
    });
  });

  it("returns empty when model output has no documentText", async () => {
    jest.mocked(getOcrPromptId).mockReturnValue("entendaDocumento.ocr.v1");
    jest.mocked(getOcrPrompt).mockReturnValue({
      id: "entendaDocumento.ocr.v1",
      system: "sys",
      user: "user",
      noticeDefault: "",
    });
    mockAnalyze.mockResolvedValue({ raw: { other: "x" }, meta: { provider: "p", model: "m" } });

    const out = await extractDocumentText("data:image/png;base64,abc");

    expect(out.documentText).toBe("");
  });

  it("returns empty when raw output is not a record", async () => {
    jest.mocked(getOcrPromptId).mockReturnValue("entendaDocumento.ocr.v1");
    jest.mocked(getOcrPrompt).mockReturnValue({
      id: "entendaDocumento.ocr.v1",
      system: "sys",
      user: "user",
      noticeDefault: "",
    });
    mockAnalyze.mockResolvedValue({ raw: "invalid", meta: { provider: "p", model: "m" } });

    const out = await extractDocumentText("data:image/png;base64,abc");

    expect(out.documentText).toBe("");
  });
});
