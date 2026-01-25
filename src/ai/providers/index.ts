import type { LlmProvider } from "../types";
import { OpenAIProvider } from "./openaiProvider";
import { MockProvider } from "./mockProvider";
import { GeminiProvider } from "./geminiProvider";
import { getLlmProvider } from "../../lib/llmProvider";

export function getProvider(override?: string | null): LlmProvider {
  const overrideValue = typeof override === "string" ? override.trim() : "";
  const providerValue = overrideValue || getLlmProvider() || "openai";
  const provider = providerValue.toLowerCase();

  switch (provider) {
    case "mock":
    case "test":
      return new MockProvider();
    case "gemini":
      return new GeminiProvider();
    case "openai":
    default:
      return new OpenAIProvider();
  }
}
