import { getPrompt } from "./prompts";
import { getProvider } from "./providers";
import { postprocessWithStats } from "./postprocess";
import type { AnalyzeResult, ProviderMeta, Prompt } from "./types";
import type { PostprocessStats } from "./postprocess";

type AnalyzeContext = {
  prompt: Prompt;
  promptId: string;
  model: string;
  inputText?: string;
  imageDataUrl?: string;
  provider: ReturnType<typeof getProvider>;
};

function buildAnalyzeContext(input: { imageDataUrl?: string; documentText?: string }): AnalyzeContext {
  const documentText = typeof input.documentText === "string" ? input.documentText.trim() : "";
  const imageDataUrl = typeof input.imageDataUrl === "string" ? input.imageDataUrl : "";
  const useText = Boolean(documentText);
  const promptId = useText
    ? process.env.ANALYZE_TEXT_PROMPT_ID ?? "entendaDocumento.text.v1"
    : process.env.PROMPT_ID ?? "entendaDocumento.v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  if (!useText && !imageDataUrl) {
    throw new Error("ANALYZE_INPUT_MISSING");
  }

  return {
    prompt: getPrompt(promptId),
    promptId,
    model,
    inputText: useText ? documentText : undefined,
    imageDataUrl: useText ? undefined : imageDataUrl,
    provider: getProvider(process.env.ANALYZE_LLM_PROVIDER),
  };
}

export async function analyzeDocument(input: { imageDataUrl?: string; documentText?: string }): Promise<{
  result: AnalyzeResult;
  meta: ProviderMeta;
  promptId: string;
  stats: PostprocessStats;
}> {
  const context = buildAnalyzeContext(input);

  const { raw, meta } = await context.provider.analyze({
    model: context.model,
    prompt: context.prompt,
    inputText: context.inputText,
    imageDataUrl: context.imageDataUrl,
  });
  const { result, stats } = postprocessWithStats(raw, context.prompt);

  return { result, meta, promptId: context.prompt.id, stats };
}

export async function analyzeDocumentStream(input: {
  imageDataUrl?: string;
  documentText?: string;
}): Promise<{ stream: AsyncIterable<string>; meta: ProviderMeta; promptId: string; prompt: Prompt }> {
  const context = buildAnalyzeContext(input);

  if (context.provider.analyzeStream) {
    const { stream, meta } = await context.provider.analyzeStream({
      model: context.model,
      prompt: context.prompt,
      inputText: context.inputText,
      imageDataUrl: context.imageDataUrl,
    });
    return { stream, meta, promptId: context.prompt.id, prompt: context.prompt };
  }

  const { raw, meta } = await context.provider.analyze({
    model: context.model,
    prompt: context.prompt,
    inputText: context.inputText,
    imageDataUrl: context.imageDataUrl,
  });

  async function* iterator() {
    yield JSON.stringify(raw);
  }

  return { stream: iterator(), meta, promptId: context.prompt.id, prompt: context.prompt };
}
