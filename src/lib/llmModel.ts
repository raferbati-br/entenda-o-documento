/**
 * Obtém o modelo de linguagem configurado via variável de ambiente.
 */

import { DEFAULT_LLM_MODEL } from "@/lib/constants";

// Retorna o modelo LLM, com fallback para padrão
export function getLlmModel(): string {
  return process.env.LLM_MODEL ?? DEFAULT_LLM_MODEL;
}
