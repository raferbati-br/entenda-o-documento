import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AnalyzeResult } from "@/ai/types";

vi.mock("@/ai/llmContext", () => ({
  buildLlmContext: vi.fn(() => ({ model: "test-model", provider: { analyze: vi.fn() } })),
}));

vi.mock("@/lib/promptIds", () => ({
  getAnalyzePromptId: vi.fn(),
}));

vi.mock("@/ai/prompts", () => ({
  getPrompt: vi.fn(),
}));

vi.mock("@/ai/postprocess", () => ({
  postprocessWithStats: vi.fn(),
}));

import { analyzeDocument } from "@/ai/analyzeDocument";
import { buildLlmContext } from "@/ai/llmContext";
import { getAnalyzePromptId } from "@/lib/promptIds";
import { getPrompt } from "@/ai/prompts";
import { postprocessWithStats } from "@/ai/postprocess";

const mockAnalyze = vi.fn();

describe("analyzeDocument", () => {
  beforeEach(() => {
    mockAnalyze.mockReset();
    vi.mocked(buildLlmContext).mockReturnValue({ model: "test-model", provider: { analyze: mockAnalyze } });
    vi.mocked(getAnalyzePromptId).mockReset();
    vi.mocked(getPrompt).mockReset();
    vi.mocked(postprocessWithStats).mockReset();
  });

  it("throws when both image and text are missing", async () => {
    vi.mocked(getAnalyzePromptId).mockReturnValue("entendaDocumento.v1");
    vi.mocked(getPrompt).mockReturnValue({ id: "entendaDocumento.v1" });

    await expect(analyzeDocument({})).rejects.toThrow("ANALYZE_INPUT_MISSING");
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it("uses document text when provided", async () => {
    const prompt = { id: "entendaDocumento.text.v1" };
    const result: AnalyzeResult = { confidence: 0.5, cards: [], notice: "ok" };
    vi.mocked(getAnalyzePromptId).mockReturnValue("entendaDocumento.text.v1");
    vi.mocked(getPrompt).mockReturnValue(prompt);
    mockAnalyze.mockResolvedValue({ raw: { any: "raw" }, meta: { provider: "p", model: "m" } });
    vi.mocked(postprocessWithStats).mockReturnValue({ result, stats: { sanitizerApplied: false, confidenceLow: false } });

    const out = await analyzeDocument({ documentText: "  texto  " });

    expect(vi.mocked(getAnalyzePromptId)).toHaveBeenCalledWith(true);
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
    vi.mocked(getAnalyzePromptId).mockReturnValue("entendaDocumento.v1");
    vi.mocked(getPrompt).mockReturnValue(prompt);
    mockAnalyze.mockResolvedValue({ raw: { any: "raw" }, meta: { provider: "p2", model: "m2" } });
    vi.mocked(postprocessWithStats).mockReturnValue({ result, stats: { sanitizerApplied: true, confidenceLow: true } });

    const out = await analyzeDocument({ imageDataUrl: "data:image/png;base64,abc" });

    expect(vi.mocked(getAnalyzePromptId)).toHaveBeenCalledWith(false);
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
