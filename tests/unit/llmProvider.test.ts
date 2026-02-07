import { getAnalyzeLlmProvider, getLlmProvider } from "@/lib/llmProvider";

describe("llmProvider", () => {
  beforeEach(() => {
    delete process.env.ANALYZE_LLM_PROVIDER;
    delete process.env.LLM_PROVIDER;
  });

  it("returns trimmed analyze provider", () => {
    process.env.ANALYZE_LLM_PROVIDER = "  openai  ";
    expect(getAnalyzeLlmProvider()).toBe("openai");
  });

  it("returns trimmed default provider", () => {
    process.env.LLM_PROVIDER = "  gemini  ";
    expect(getLlmProvider()).toBe("gemini");
  });

  it("returns undefined when not set", () => {
    expect(getAnalyzeLlmProvider()).toBeUndefined();
    expect(getLlmProvider()).toBeUndefined();
  });
});
