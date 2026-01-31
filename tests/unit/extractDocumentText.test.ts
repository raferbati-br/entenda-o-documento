import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/ai/llmContext", () => ({
  buildLlmContext: vi.fn(() => ({ model: "test-model", provider: { analyze: vi.fn() } })),
}));

vi.mock("@/lib/promptIds", () => ({
  getOcrPromptId: vi.fn(),
}));

vi.mock("@/ai/prompts", () => ({
  getOcrPrompt: vi.fn(),
}));

vi.mock("@/lib/text", () => ({
  redactSensitiveData: vi.fn((text: string) => text.replace(/\d/g, "*")),
  safeShorten: vi.fn((text: string) => text),
}));

import { extractDocumentText } from "@/ai/extractDocumentText";
import { buildLlmContext } from "@/ai/llmContext";
import { getOcrPromptId } from "@/lib/promptIds";
import { getOcrPrompt } from "@/ai/prompts";
import { redactSensitiveData, safeShorten } from "@/lib/text";

const mockAnalyze = vi.fn();

describe("extractDocumentText", () => {
  beforeEach(() => {
    mockAnalyze.mockReset();
    vi.mocked(buildLlmContext).mockReturnValue({ model: "test-model", provider: { analyze: mockAnalyze } });
    vi.mocked(getOcrPromptId).mockReset();
    vi.mocked(getOcrPrompt).mockReset();
    vi.mocked(redactSensitiveData).mockClear();
    vi.mocked(safeShorten).mockClear();
  });

  it("extracts, redacts, and shortens document text", async () => {
    vi.mocked(getOcrPromptId).mockReturnValue("entendaDocumento.ocr.v1");
    vi.mocked(getOcrPrompt).mockReturnValue({
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
    vi.mocked(getOcrPromptId).mockReturnValue("entendaDocumento.ocr.v1");
    vi.mocked(getOcrPrompt).mockReturnValue({
      id: "entendaDocumento.ocr.v1",
      system: "sys",
      user: "user",
      noticeDefault: "",
    });
    mockAnalyze.mockResolvedValue({ raw: { other: "x" }, meta: { provider: "p", model: "m" } });

    const out = await extractDocumentText("data:image/png;base64,abc");

    expect(out.documentText).toBe("");
  });
});
