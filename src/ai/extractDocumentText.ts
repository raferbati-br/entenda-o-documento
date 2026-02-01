/**
 * Módulo para extração de texto de imagens de documentos usando OCR via IA.
 * Recebe uma imagem e retorna o texto extraído, sanitizado e redigido.
 */

import { getOcrPrompt } from "./prompts";
import { getOcrPromptId } from "../lib/promptIds";
import { buildLlmContext } from "./llmContext";
import { redactSensitiveData, safeShorten } from "../lib/text";
import { isRecord } from "../lib/typeGuards";

// Extrai o texto do resultado bruto da IA, validando o tipo
function getDocumentText(raw: unknown): string {
  if (!isRecord(raw)) return "";
  const value = raw.documentText;
  return typeof value === "string" ? value : "";
}

// Extrai texto de uma imagem usando IA para OCR
export async function extractDocumentText(imageDataUrl: string): Promise<{
  documentText: string;
  meta: { provider: string; model: string };
  promptId: string;
}> {
  const promptId = getOcrPromptId();
  const { model, provider } = buildLlmContext();

  const prompt = getOcrPrompt(promptId);

  // Executa análise de imagem para extrair texto
  const { raw, meta } = await provider.analyze({ model, prompt, imageDataUrl });

  const text = getDocumentText(raw);
  // Sanitiza, redige dados sensíveis e limita tamanho
  const sanitized = safeShorten(redactSensitiveData(text), 3000);

  return { documentText: sanitized, meta, promptId: prompt.id };
}
