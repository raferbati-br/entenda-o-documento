import { getPrompt } from "./prompts";
import { postprocessWithStats } from "./postprocess";
import type { AnalyzeResult, ProviderMeta } from "./types";
import type { PostprocessStats } from "./postprocess";
import { getAnalyzePromptId } from "../lib/promptIds";
import { getAnalyzeLlmProvider } from "../lib/llmProvider";
import { buildLlmContext } from "./llmContext";

export async function analyzeDocument(input: { imageDataUrl?: string; documentText?: string }): Promise<{
  result: AnalyzeResult;
  meta: ProviderMeta;
  promptId: string;
  stats: PostprocessStats;
}> {
  const documentText = typeof input.documentText === "string" ? input.documentText.trim() : "";
  const imageDataUrl = typeof input.imageDataUrl === "string" ? input.imageDataUrl : "";
  const useText = Boolean(documentText);
  const promptId = getAnalyzePromptId(useText);
  const { model, provider } = buildLlmContext(getAnalyzeLlmProvider());

  const prompt = getPrompt(promptId);

  if (!useText && !imageDataUrl) {
    throw new Error("ANALYZE_INPUT_MISSING");
  }

  const { raw, meta } = await provider.analyze({
    model,
    prompt,
    inputText: useText ? documentText : undefined,
    imageDataUrl: useText ? undefined : imageDataUrl,
  });
  const { result, stats } = postprocessWithStats(raw, prompt);

  return { result, meta, promptId: prompt.id, stats };
}
