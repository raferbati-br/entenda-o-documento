jest.mock("@/ai/providers", () => ({
  getProvider: jest.fn(),
}));

jest.mock("@/lib/llmModel", () => ({
  getLlmModel: jest.fn(),
}));

import { buildLlmContext } from "@/ai/llmContext";
import { getProvider } from "@/ai/providers";
import { getLlmModel } from "@/lib/llmModel";

describe("buildLlmContext", () => {
  beforeEach(() => {
    jest.mocked(getProvider).mockReset();
    jest.mocked(getLlmModel).mockReset();
  });

  it("returns model and provider", () => {
    jest.mocked(getLlmModel).mockReturnValue("model-x");
    const provider = { analyze: jest.fn(), answer: jest.fn() } as const;
    jest.mocked(getProvider).mockReturnValue(provider);

    const out = buildLlmContext();

    expect(out).toEqual({ model: "model-x", provider });
    expect(jest.mocked(getProvider)).toHaveBeenCalledWith(undefined);
  });

  it("passes override provider", () => {
    jest.mocked(getLlmModel).mockReturnValue("model-y");
    const provider = { analyze: jest.fn(), answer: jest.fn() } as const;
    jest.mocked(getProvider).mockReturnValue(provider);

    const out = buildLlmContext("mock");

    expect(out).toEqual({ model: "model-y", provider });
    expect(jest.mocked(getProvider)).toHaveBeenCalledWith("mock");
  });
});
