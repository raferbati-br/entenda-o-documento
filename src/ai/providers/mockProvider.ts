import type { AnalyzeInput, AnswerResponse, AnswerStreamResponse, LlmProvider, ProviderResponse, Prompt } from "../types";

function mockAnalyzeResponse(): { confidence: number; cards: Array<{ id: string; title: string; text: string }>; notice: string } {
  return {
    confidence: 0.82,
    cards: [
      { id: "whatIs", title: "O que e este documento", text: "Documento de teste." },
      { id: "whatSays", title: "O que diz", text: "Conteudo simulado para testes." },
      { id: "dates", title: "Datas", text: "Sem datas relevantes." },
      { id: "terms", title: "Termos", text: "Sem termos complexos." },
      { id: "whatUsuallyHappens", title: "O que acontece", text: "Nada a destacar." },
    ],
    notice: "Resposta simulada para testes.",
  };
}

function mockOcrResponse(): { documentText: string } {
  return { documentText: "Texto simulado para OCR." };
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
      text: "Resposta simulada para perguntas.",
      meta: { provider: "mock", model: input.model },
    };
  }

  async answerStream(input: { model: string; prompt: Prompt }): Promise<AnswerStreamResponse> {
    async function* iterator() {
      yield "Resposta simulada para perguntas.";
    }

    return {
      stream: iterator(),
      meta: { provider: "mock", model: input.model },
    };
  }
}
