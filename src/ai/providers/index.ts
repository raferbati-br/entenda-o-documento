import type { LlmProvider } from "../types";
import { OpenAIProvider } from "./openaiProvider";
import { MockProvider } from "./mockProvider";

export function getProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();

  switch (provider) {
    case "mock":
    case "test":
      return new MockProvider();
    case "openai":
    default:
      return new OpenAIProvider();
  }
}
