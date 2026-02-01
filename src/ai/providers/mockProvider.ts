import type { AnalyzeInput, AnswerResponse, AnswerStreamResponse, LlmProvider, ProviderResponse, Prompt } from "../types";
import { MOCK_RESPONSES } from "@/lib/constants";

function mockAnalyzeResponse() {
  return MOCK_RESPONSES.ANALYZE;
}

function mockOcrResponse() {
  return MOCK_RESPONSES.OCR;
}

async function* mockAnswerIterator() {
  yield MOCK_RESPONSES.ANSWER;
}

export class MockProvider implements LlmProvider {
  async analyze(input: AnalyzeInput): Promise<ProviderResponse> {
    const isOcr = input.prompt.id.includes(".ocr");
    const raw = isOcr ? mockOcrResponse() : mockAnalyzeResponse();
    return {
      raw,
      meta: { provider: "mock", model: input.model },
    };
  }

  async answer(input: { model: string; prompt: Prompt }): Promise<AnswerResponse> {
    return {
      text: MOCK_RESPONSES.ANSWER,
      meta: { provider: "mock", model: input.model },
    };
  }

  async answerStream(input: { model: string; prompt: Prompt }): Promise<AnswerStreamResponse> {
    return {
      stream: mockAnswerIterator(),
      meta: { provider: "mock", model: input.model },
    };
  }
}
