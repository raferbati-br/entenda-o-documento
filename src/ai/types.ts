/**
 * Definições de tipos TypeScript para o módulo de IA.
 * Inclui tipos para cards, resultados de análise, prompts e interfaces de provedores.
 */

// IDs possíveis para os cards de análise
export type CardId = "whatIs" | "whatSays" | "dates" | "terms" | "whatUsuallyHappens";

// Estrutura de um card individual
export type Card = {
  id: CardId;
  title: string;
  text: string;
};

// Resultado da análise de documento
export type AnalyzeResult = {
  confidence: number; // Confiança entre 0 e 1
  cards: Card[]; // Lista de cards estruturados
  notice: string; // Aviso adicional
};

// Estrutura de um prompt para IA
export type Prompt = {
  id: string;
  system: string; // Prompt do sistema
  user: string; // Prompt do usuário
  noticeDefault: string; // Aviso padrão
};

// Metadados do provedor de IA
export type ProviderMeta = {
  provider: string;
  model: string;
};

// Resposta de análise do provedor
export type ProviderResponse = {
  raw: unknown; // Dados brutos retornados
  meta: ProviderMeta;
};

// Resposta de pergunta do provedor
export type AnswerResponse = {
  text: string; // Texto da resposta
  meta: ProviderMeta;
};

// Resposta de pergunta em stream
export type AnswerStreamResponse = {
  stream: AsyncIterable<string>; // Stream assíncrono de texto
  meta: ProviderMeta;
};

// Entrada para análise
export type AnalyzeInput = {
  model: string;
  prompt: Prompt;
  imageDataUrl?: string; // Opcional para análise de imagem
  inputText?: string; // Opcional para análise de texto
};

// Interface para provedores de LLM
export interface LlmProvider {
  analyze(input: AnalyzeInput): Promise<ProviderResponse>; // Método obrigatório para análise
  answer(input: { model: string; prompt: Prompt }): Promise<AnswerResponse>; // Método obrigatório para resposta
  answerStream?(input: { model: string; prompt: Prompt }): Promise<AnswerStreamResponse>; // Método opcional para stream
}
