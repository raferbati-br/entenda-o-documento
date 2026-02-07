import type { AnalyzeResult } from "@/ai/types";

jest.mock("@/ai/llmContext", () => ({
  buildLlmContext: jest.fn(() => ({ model: "test-model", provider: { analyze: jest.fn() } })),
}));

jest.mock("@/lib/promptIds", () => ({
  getAnalyzeTextPromptId: jest.fn(),
  getAnalyzeImagePromptId: jest.fn(),
}));

jest.mock("@/ai/prompts", () => ({
  getPrompt: jest.fn(),
}));

jest.mock("@/ai/postprocess", () => ({
  postprocessWithStats: jest.fn(),
}));

import { analyzeDocument } from "@/ai/analyzeDocument";
import { buildLlmContext } from "@/ai/llmContext";
import { getAnalyzeTextPromptId, getAnalyzeImagePromptId } from "@/lib/promptIds";
import { getPrompt } from "@/ai/prompts";
import { postprocessWithStats } from "@/ai/postprocess";

const mockAnalyze = jest.fn();

describe("analyzeDocument", () => {
  beforeEach(() => {
    mockAnalyze.mockReset();
    jest.mocked(buildLlmContext).mockReturnValue({ model: "test-model", provider: { analyze: mockAnalyze } });
    jest.mocked(getAnalyzeTextPromptId).mockReset();
    jest.mocked(getAnalyzeImagePromptId).mockReset();
    jest.mocked(getPrompt).mockReset();
    jest.mocked(postprocessWithStats).mockReset();
  });

  it("throws when both image and text are missing", async () => {
    jest.mocked(getAnalyzeImagePromptId).mockReturnValue("entendaDocumento.v1");
    jest.mocked(getPrompt).mockReturnValue({ id: "entendaDocumento.v1" });

    await expect(analyzeDocument({})).rejects.toThrow("ANALYZE_INPUT_MISSING");
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it("uses document text when provided", async () => {
    const prompt = { id: "entendaDocumento.text.v1" };
    const result: AnalyzeResult = { confidence: 0.5, cards: [], notice: "ok" };
    jest.mocked(getAnalyzeTextPromptId).mockReturnValue("entendaDocumento.text.v1");
    jest.mocked(getPrompt).mockReturnValue(prompt);
    mockAnalyze.mockResolvedValue({ raw: { any: "raw" }, meta: { provider: "p", model: "m" } });
    jest.mocked(postprocessWithStats).mockReturnValue({ result, stats: { sanitizerApplied: false, confidenceLow: false } });

    const out = await analyzeDocument({ documentText: "  texto  " });

    expect(jest.mocked(getAnalyzeTextPromptId)).toHaveBeenCalled();
    expect(mockAnalyze).toHaveBeenCalledWith({
      model: "test-model",
      prompt,
      inputText: "texto",
      imageDataUrl: undefined,
    });
    expect(out).toEqual({
      result,
      meta: { provider: "p", model: "m" },
      promptId: prompt.id,
      stats: { sanitizerApplied: false, confidenceLow: false },
    });
  });

  it("uses image when text is not provided", async () => {
    const prompt = { id: "entendaDocumento.v1" };
    const result: AnalyzeResult = { confidence: 0.9, cards: [], notice: "ok" };
    jest.mocked(getAnalyzeImagePromptId).mockReturnValue("entendaDocumento.v1");
    jest.mocked(getPrompt).mockReturnValue(prompt);
    mockAnalyze.mockResolvedValue({ raw: { any: "raw" }, meta: { provider: "p2", model: "m2" } });
    jest.mocked(postprocessWithStats).mockReturnValue({ result, stats: { sanitizerApplied: true, confidenceLow: true } });

    const out = await analyzeDocument({ imageDataUrl: "data:image/png;base64,abc" });

    expect(jest.mocked(getAnalyzeImagePromptId)).toHaveBeenCalled();
    expect(mockAnalyze).toHaveBeenCalledWith({
      model: "test-model",
      prompt,
      inputText: undefined,
      imageDataUrl: "data:image/png;base64,abc",
    });
    expect(out).toEqual({
      result,
      meta: { provider: "p2", model: "m2" },
      promptId: prompt.id,
      stats: { sanitizerApplied: true, confidenceLow: true },
    });
  });
});
