// Centralização de todas as constantes do projeto

// === CONFIGURAÇÕES PADRÃO ===
export const DEFAULT_LLM_MODEL = "gpt-4o-mini";
export const DEFAULT_LLM_PROVIDER = "openai";
export const DEFAULT_PROMPT_ID = "entendaDocumento.v1";
export const DEFAULT_OCR_PROMPT_ID = "entendaDocumento.ocr.v1";
export const DEFAULT_QA_PROMPT_ID = "entendaDocumento.qa.v1";
export const DEFAULT_ANALYZE_TEXT_PROMPT_ID = "entendaDocumento.text.v1";
export const DEFAULT_ANALYZE_TEXT_ONLY = false;
export const DEFAULT_ANALYZE_OCR_MIN_CHARS = 200;
export const DEFAULT_ANALYZE_OCR_MIN_ALPHA_RATIO = 0.3;

// === MENSAGENS DE ERRO ===
export const ERROR_MESSAGES = {
  ORIGIN_NOT_ALLOWED: "Origem nao permitida",
  TOO_MANY_REQUESTS: "Muitas tentativas. Aguarde um pouco e tente novamente.",
  API_KEY_NOT_CONFIGURED: "Chave de API nao configurada",
  TOKEN_SECRET_NOT_CONFIGURED: "API_TOKEN_SECRET nao configurada",
  GENERATE_TOKEN_ERROR: "Erro ao gerar token",
  MISSING_INPUT: "ANALYZE_INPUT_MISSING", // De analyzeDocument.ts
  DOCUMENT_UNAVAILABLE: "Documento indisponivel para visualizacao.",
  CONTEXT_BUILD_ERROR: "Nao foi possivel montar o contexto do documento.",
  DOCUMENT_UNAVAILABLE_SHORT: "Documento indisponivel.",
  ANSWER_QUESTION_ERROR: "Erro ao responder pergunta.",
  EMPTY_RESPONSE: "Resposta vazia.",
  LOW_CONFIDENCE: "Difícil de ler",
};

// === TEXTOS DA INTERFACE ===
export const UI_TEXTS = {
  APP_TITLE: "Entenda o Documento",
  APP_DESCRIPTION: "Explicações simples para documentos burocráticos",
  HOME_TITLE: "Entenda qualquer documento num piscar de olhos",
  HOME_SUBTITLE: "Envie uma imagem de um documento e receba uma explicação direta ao ponto.",
  DOCUMENTS_TITLE: "Documentos Burocráticos",
  CAMERA_HINT: "Tente pegar o documento inteiro.",
  ANALYZING_MESSAGE: "Lendo o documento...",
  ANALYZING_STEPS: [
    "Lendo o documento...",
    "Identificando termos técnicos...",
    "Traduzindo juridiquês...",
    "Gerando explicação simples...",
    "Quase pronto..."
  ],
  QUESTIONS_TITLE: "Tire suas duvidas sobre o documento",
  VIEW_DOCUMENT: "Ver documento",
  RESULT_TITLE: "📋 *Explicação do Documento*",
  RESULT_FOOTER: "Gerado por Entenda o Documento",
  RESULT_SHARE_TITLE: "Explicação do Documento",
  DEFAULT_DOCUMENT_TITLE: "Documento",
  WHAT_IS_QUESTION: "O que este documento pede?",
  CONFIDENCE_LOW: "Difícil de ler",
  CONFIDENCE_MEDIUM: "Leitura parcial",
  CONFIDENCE_HIGH: "Leitura clara",
  SPEAK_STOP: "Parar leitura",
  SPEAK_START: "Ler em voz alta",
  TTS_UNSUPPORTED: "Seu navegador não suporta leitura em voz alta.",
  TTS_ERROR: "Erro na leitura.",
  TTS_INTERRUPTED: "Leitura interrompida.",
};

// === OUTRAS CONSTANTES ===
export const QUALITY_METRICS_TAGS = {
  ANALYZE: "analyze",
  ANALYZE_TEXT_ONLY: "analyze_text_only",
  OCR: "ocr",
  QA: "qa",
  CAPTURE: "capture",
  SESSION_TOKEN: "session_token",
  HEALTH: "health",
  FEEDBACK: "feedback",
};