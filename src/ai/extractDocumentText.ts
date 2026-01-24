import { getOcrPrompt } from "./prompts";
import { getOcrPromptId } from "../lib/promptIds";
import { buildLlmContext } from "./llmContext";
import { redactSensitiveData, safeShorten } from "../lib/text";
import { isRecord } from "../lib/typeGuards";

function getDocumentText(raw: unknown): string {
  if (!isRecord(raw)) return "";
  const value = raw.documentText;
  return typeof value === "string" ? value : "";
}

export async function extractDocumentText(imageDataUrl: string): Promise<{
  documentText: string;
  meta: { provider: string; model: string };
  promptId: string;
}> {
  const promptId = getOcrPromptId();
  const { model, provider } = buildLlmContext();

  const prompt = getOcrPrompt(promptId);

  const { raw, meta } = await provider.analyze({ model, prompt, imageDataUrl });

  const text = getDocumentText(raw);
  const sanitized = safeShorten(redactSensitiveData(text), 3000);

  return { documentText: sanitized, meta, promptId: prompt.id };
}
