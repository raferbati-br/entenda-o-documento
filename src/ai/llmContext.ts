/**
 * Módulo para construir o contexto do modelo de linguagem (LLM).
 * Define o modelo e provedor a serem usados nas interações com IA.
 */

import { getProvider } from "./providers";
import { getLlmModel } from "../lib/llmModel";

// Constrói o contexto com modelo e provedor, permitindo override opcional do provedor
export function buildLlmContext(overrideProvider?: string | null): {
  model: string;
  provider: ReturnType<typeof getProvider>;
} {
  return {
    model: getLlmModel(),
    provider: getProvider(overrideProvider),
  };
}
