import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/ai/providers", () => ({
  getProvider: vi.fn(),
}));

vi.mock("@/lib/llmModel", () => ({
  getLlmModel: vi.fn(),
}));

import { buildLlmContext } from "@/ai/llmContext";
import { getProvider } from "@/ai/providers";
import { getLlmModel } from "@/lib/llmModel";

describe("buildLlmContext", () => {
  beforeEach(() => {
    vi.mocked(getProvider).mockReset();
    vi.mocked(getLlmModel).mockReset();
  });

  it("returns model and provider", () => {
    vi.mocked(getLlmModel).mockReturnValue("model-x");
    const provider = { analyze: vi.fn(), answer: vi.fn() } as const;
    vi.mocked(getProvider).mockReturnValue(provider);

    const out = buildLlmContext();

    expect(out).toEqual({ model: "model-x", provider });
    expect(vi.mocked(getProvider)).toHaveBeenCalledWith(undefined);
  });

  it("passes override provider", () => {
    vi.mocked(getLlmModel).mockReturnValue("model-y");
    const provider = { analyze: vi.fn(), answer: vi.fn() } as const;
    vi.mocked(getProvider).mockReturnValue(provider);

    const out = buildLlmContext("mock");

    expect(out).toEqual({ model: "model-y", provider });
    expect(vi.mocked(getProvider)).toHaveBeenCalledWith("mock");
  });
});
