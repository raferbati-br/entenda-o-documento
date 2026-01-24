import { getPrompt } from "./prompts";
import { getProvider } from "./providers";
import { postprocessWithStats } from "./postprocess";
import type { AnalyzeResult, ProviderMeta } from "./types";
import type { PostprocessStats } from "./postprocess";

export async function analyzeDocument(input: { imageDataUrl?: string; documentText?: string }): Promise<{
  result: AnalyzeResult;
  meta: ProviderMeta;
  promptId: string;
  stats: PostprocessStats;
}> {
  const documentText = typeof input.documentText === "string" ? input.documentText.trim() : "";
  const imageDataUrl = typeof input.imageDataUrl === "string" ? input.imageDataUrl : "";
  const useText = Boolean(documentText);
  const promptId = useText
    ? process.env.ANALYZE_TEXT_PROMPT_ID ?? "entendaDocumento.text.v1"
    : process.env.PROMPT_ID ?? "entendaDocumento.v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o";

  const prompt = getPrompt(promptId);
  const provider = getProvider(process.env.ANALYZE_LLM_PROVIDER);

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
