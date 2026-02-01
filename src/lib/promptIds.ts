/**
 * Obtém IDs de prompts configurados via variável de ambiente.
 */

import {
  DEFAULT_PROMPT_ID,
  DEFAULT_ANALYZE_TEXT_PROMPT_ID,
  DEFAULT_OCR_PROMPT_ID,
  DEFAULT_QA_PROMPT_ID,
} from "@/lib/constants";

// ID para análise de texto
export function getAnalyzeTextPromptId(): string {
  return process.env.ANALYZE_TEXT_PROMPT_ID ?? DEFAULT_ANALYZE_TEXT_PROMPT_ID;
}

// ID para análise de imagem
export function getAnalyzeImagePromptId(): string {
  return process.env.PROMPT_ID ?? DEFAULT_PROMPT_ID;
}

// ID para OCR
export function getOcrPromptId(): string {
  return process.env.OCR_PROMPT_ID ?? DEFAULT_OCR_PROMPT_ID;
}

// ID para QA
export function getQaPromptId(): string {
  return process.env.QA_PROMPT_ID ?? DEFAULT_QA_PROMPT_ID;
}
