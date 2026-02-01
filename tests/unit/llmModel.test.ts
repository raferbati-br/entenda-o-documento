import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getLlmModel } from "@/lib/llmModel";


describe("llmModel", () => {
  const realEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...realEnv };
    delete process.env.LLM_MODEL;
  });

  afterEach(() => {
    process.env = { ...realEnv };
  });

  it("returns default when env is not set", () => {
    expect(getLlmModel()).toBe("gpt-4o-mini");
  });

  it("uses env override", () => {
    process.env.LLM_MODEL = "custom-model";
    expect(getLlmModel()).toBe("custom-model");
  });
});
