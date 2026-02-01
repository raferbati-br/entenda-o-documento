/**
 * Módulo principal para análise de documentos usando IA multimodal.
 * Recebe texto extraído ou imagem e retorna um resultado estruturado com metadados.
 */

import { getPrompt } from "./prompts";
import { postprocessWithStats } from "./postprocess";
import type { AnalyzeResult, ProviderMeta } from "./types";
import type { PostprocessStats } from "./postprocess";
import { getAnalyzeImagePromptId, getAnalyzeTextPromptId } from "../lib/promptIds";
import { getAnalyzeLlmProvider } from "../lib/llmProvider";
import { buildLlmContext } from "./llmContext";
import { ERROR_MESSAGES } from "../lib/constants";

export async function analyzeDocument(input: { imageDataUrl?: string; documentText?: string }): Promise<{
  result: AnalyzeResult;
  meta: ProviderMeta;
  promptId: string;
  stats: PostprocessStats;
}> {
  // Valida e prepara os dados de entrada: texto ou imagem
  const documentText = typeof input.documentText === "string" ? input.documentText.trim() : "";
  const imageDataUrl = typeof input.imageDataUrl === "string" ? input.imageDataUrl : "";
  const useText = Boolean(documentText);
  const promptId = useText ? getAnalyzeTextPromptId() : getAnalyzeImagePromptId();
  const { model, provider } = buildLlmContext(getAnalyzeLlmProvider());

  const prompt = getPrompt(promptId);

  // Verifica se há entrada válida (texto ou imagem)
  if (!useText && !imageDataUrl) {
    throw new Error(ERROR_MESSAGES.MISSING_INPUT);
  }

  // Executa a análise com o provedor de IA
  const { raw, meta } = await provider.analyze({
    model,
    prompt,
    inputText: useText ? documentText : undefined,
    imageDataUrl: useText ? undefined : imageDataUrl,
  });
  // Pós-processa o resultado bruto para suavizar linguagem e redigir dados sensíveis
  const { result, stats } = postprocessWithStats(raw, prompt);

  return { result, meta, promptId: prompt.id, stats };
}
