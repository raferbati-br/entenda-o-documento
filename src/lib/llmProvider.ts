/**
 * Obtém o provedor de LLM configurado via variável de ambiente.
 */

// Retorna provedor para análise
export function getAnalyzeLlmProvider(): string | undefined {
  const value = process.env.ANALYZE_LLM_PROVIDER;
  return typeof value === "string" ? value.trim() : undefined;
}

// Retorna provedor padrão
export function getLlmProvider(): string | undefined {
  const value = process.env.LLM_PROVIDER;
  return typeof value === "string" ? value.trim() : undefined;
}
