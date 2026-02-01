import { DEFAULT_LLM_MODEL } from "@/lib/constants";

export function getLlmModel(): string {
  return process.env.LLM_MODEL ?? DEFAULT_LLM_MODEL;
}
