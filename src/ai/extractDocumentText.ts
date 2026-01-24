import { getOcrPrompt } from "./prompts";
import { getOcrPromptId } from "../lib/promptIds";
import { buildLlmContext } from "./llmContext";
import { redactSensitiveData, safeShorten } from "../lib/text";

export async function extractDocumentText(imageDataUrl: string): Promise<{
  documentText: string;
  meta: { provider: string; model: string };
  promptId: string;
}> {
  const promptId = getOcrPromptId();
  const { model, provider } = buildLlmContext();

  const prompt = getOcrPrompt(promptId);

  const { raw, meta } = await provider.analyze({ model, prompt, imageDataUrl });

  const text = typeof (raw as any)?.documentText === "string" ? (raw as any).documentText : "";
  const sanitized = safeShorten(redactSensitiveData(text), 3000);

  return { documentText: sanitized, meta, promptId: prompt.id };
}
