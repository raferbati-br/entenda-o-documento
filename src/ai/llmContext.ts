import { getProvider } from "./providers";
import { getLlmModel } from "../lib/llmModel";

export function buildLlmContext(overrideProvider?: string | null): {
  model: string;
  provider: ReturnType<typeof getProvider>;
} {
  return {
    model: getLlmModel(),
    provider: getProvider(overrideProvider),
  };
}
