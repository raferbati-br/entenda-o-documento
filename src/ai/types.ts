export type CardId = "whatIs" | "whatSays" | "dates" | "terms" | "whatUsuallyHappens";

export type Card = {
  id: CardId;
  title: string;
  text: string;
};

export type AnalyzeResult = {
  confidence: number; // 0..1
  cards: Card[];
  notice: string;
};

export type Prompt = {
  id: string;
  system: string;
  user: string;
  noticeDefault: string;
};

export type ProviderMeta = {
  provider: string;
  model: string;
};

export type ProviderResponse = {
  raw: unknown;
  meta: ProviderMeta;
};

export type AnswerResponse = {
  text: string;
  meta: ProviderMeta;
};

export type AnswerStreamResponse = {
  stream: AsyncIterable<string>;
  meta: ProviderMeta;
};

export type AnalyzeInput = {
  model: string;
  prompt: Prompt;
  imageDataUrl?: string;
  inputText?: string;
};

export interface LlmProvider {
  analyze(input: AnalyzeInput): Promise<ProviderResponse>;
  answer(input: { model: string; prompt: Prompt }): Promise<AnswerResponse>;
  answerStream?(input: { model: string; prompt: Prompt }): Promise<AnswerStreamResponse>;
}
