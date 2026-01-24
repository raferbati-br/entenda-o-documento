export function getLlmModel(): string {
  return process.env.LLM_MODEL ?? "gpt-4o-mini";
}
