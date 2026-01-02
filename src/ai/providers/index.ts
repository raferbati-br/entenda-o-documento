import type { LlmProvider } from "../types";
import { OpenAIProvider } from "./openaiProvider";

export function getProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();

  switch (provider) {
    case "openai":
    default:
      return new OpenAIProvider();
  }
}
