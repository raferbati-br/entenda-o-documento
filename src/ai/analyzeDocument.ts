import { getPrompt } from "./prompts";
import { getProvider } from "./providers";
import { postprocessWithStats } from "./postprocess";
import type { AnalyzeResult, ProviderMeta } from "./types";
import type { PostprocessStats } from "./postprocess";

export async function analyzeDocument(imageDataUrl: string): Promise<{
  result: AnalyzeResult;
  meta: ProviderMeta;
  promptId: string;
  stats: PostprocessStats;
}> {
  const promptId = process.env.PROMPT_ID ?? "entendaDocumento.v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o";

  const prompt = getPrompt(promptId);
  const provider = getProvider();

  const { raw, meta } = await provider.analyze({ model, prompt, imageDataUrl });
  const { result, stats } = postprocessWithStats(raw, prompt);

  return { result, meta, promptId: prompt.id, stats };
}
