export function getAnalyzeLlmProvider(): string | undefined {
  const value = process.env.ANALYZE_LLM_PROVIDER;
  return typeof value === "string" ? value.trim() : undefined;
}

export function getLlmProvider(): string | undefined {
  const value = process.env.LLM_PROVIDER;
  return typeof value === "string" ? value.trim() : undefined;
}
