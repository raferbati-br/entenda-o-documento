// Centralização de todas as constantes do projeto

// === FUNÇÕES AUXILIARES ===
export function getInternalErrorMessage(action: string): string {
  return `Erro interno ao ${action}`;
}

// === CONSTANTES DE MENSAGENS ===
export const SESSION_EXPIRED_MESSAGE = "Sessão expirada. Tente novamente.";
export const IMAGE_NOT_FOUND_MESSAGE = "Imagem não encontrada ou inválida (capture expirou)";
export const IMAGE_INVALID_MESSAGE = "Imagem inválida";
export const IMAGE_NOT_PROVIDED_MESSAGE = "Imagem não informada";
export const IMAGE_TYPE_UNSUPPORTED_MESSAGE = "Tipo de imagem não suportado. Use JPG, PNG ou WebP";
export const IMAGE_TOO_LARGE_MESSAGE = "A imagem é muito grande. Tente aproximar o documento ou usar boa iluminação";
export const CONTEXT_MISSING_MESSAGE = "Contexto do documento não informado";
export const CONTEXT_TOO_LONG_MESSAGE = "Contexto muito longo";
export const QUESTION_TOO_SHORT_MESSAGE = "Pergunta muito curta";
export const QUESTION_TOO_LONG_MESSAGE = "Pergunta longa demais";
export const SYSTEM_BUSY_MESSAGE = "O sistema está temporariamente ocupado. Tente novamente em alguns minutos";
export const SYSTEM_FULL_MESSAGE = "O sistema está temporariamente cheio. Tente novamente em instantes";
export const MODEL_INVALID_JSON_MESSAGE = "Modelo não retornou JSON válido";
export const MODEL_NO_TEXT_MESSAGE = "Modelo não retornou texto válido";

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
  API_KEY_NOT_SET: "API_KEY_NOT_SET",
  MODEL_NO_TEXT: "MODEL_NO_TEXT",
  MODEL_NO_JSON: "MODEL_NO_JSON",
  MODEL_INVALID_JSON: "MODEL_INVALID_JSON",
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
  ANALYZING_DESCRIPTION: "A inteligência artificial está analisando cada detalhe.",
  QUESTIONS_TITLE: "Tire suas dúvidas sobre o documento",
  VIEW_DOCUMENT: "Ver documento",
  RESULT_TITLE: "📋 *Explicação do Documento*",
  RESULT_FOOTER: "Gerado por Entenda o Documento",
  RESULT_SHARE_TITLE: "Explicação do Documento",
  DEFAULT_DOCUMENT_TITLE: "Documento",
  WHAT_IS_QUESTION: "O que este documento pede?",
  CONFIDENCE_MEDIUM: "Leitura parcial",
  CONFIDENCE_HIGH: "Leitura clara",
  SPEAK_STOP: "Parar leitura",
  SPEAK_START: "Ler em voz alta",
  TTS_UNSUPPORTED: "Seu navegador não suporta leitura em voz alta.",
  TTS_ERROR: "Erro na leitura.",
  TTS_INTERRUPTED: "Leitura interrompida.",
  // Novos textos
  HOME_BENEFITS_TITLE: "O que funciona bem?",
  HOME_DOCUMENTS_DESCRIPTION: "Cartas judiciais, contas, comunicados e avisos.",
  HOME_SIMPLE_EXPLANATION_TITLE: "Explicação Simples",
  HOME_SIMPLE_EXPLANATION_DESCRIPTION: "Traduzimos o 'juridiquês' para o português do dia a dia.",
  HOME_PRIVACY_TITLE: "Privacidade Total",
  HOME_PRIVACY_DESCRIPTION: "Sua foto é processada e deletada. Nada fica salvo.",
  GALLERY_BUTTON: "Galeria",
  TAKE_PHOTO_BUTTON: "Tirar foto",
  NEW_PHOTO_TITLE: "Nova Foto",
  CAMERA_PREP_TITLE: "Vamos preparar a câmera",
  CAMERA_PREP_SUBTITLE: "Para a inteligência artificial funcionar bem, siga estas dicas rápidas:",
  CAMERA_TIP_CLEAR_TEXT: "Letras Nítidas",
  CAMERA_TIP_CLEAR_TEXT_DESCRIPTION: "Aproxime até conseguir ler o texto na tela.",
  CAMERA_TIP_GOOD_LIGHT: "Boa Iluminação",
  CAMERA_TIP_GOOD_LIGHT_DESCRIPTION: "Evite sombras. A luz natural ajuda muito.",
  CAMERA_TIP_FRAMING: "Enquadramento",
  CAMERA_TIP_TITLE: "Dica",
  CAMERA_TIP_DESCRIPTION: "Mantenha a mão firme ao clicar.",
  CANCEL_AND_BACK: "Cancelar e voltar",
  CANCEL: "Cancelar",
  CHECK_IMAGE_TITLE: "Confira a imagem",
  PROCESSING_IMAGE: "Processando imagem...",
  CHOOSE_ANOTHER: "Escolher outra",
  USE_THIS: "Usar esta",
  QUESTIONS_SUBTITLE: "Escolha uma pergunta pronta ou escreva a sua.",
  EXPLANATION_TITLE: "Explicação",
  DISCLAIMER: "Este aplicativo é informativo e pode cometer erros. Consulte um profissional para orientações.",
};

// === TEXTOS DE PÓS-PROCESSAMENTO ===
export const POSTPROCESS_TEXTS = {
  CARD_TITLES: {
    whatIs: "O que é este documento",
    whatSays: "O que este documento está comunicando",
    dates: "Datas ou prazos importantes",
    terms: "📘 Palavras difíceis explicadas",
    whatUsuallyHappens: "O que normalmente acontece",
  },
  CARD_FALLBACKS: {
    whatIs: "Não foi possível confirmar pelo documento.",
    whatSays: "Não foi possível confirmar pelo documento.",
    dates: "Não foi possível confirmar datas ou prazos no documento.",
    terms: "Não há termos difíceis relevantes neste documento.",
    whatUsuallyHappens: "Não foi possível confirmar pelo documento.",
  },
  SOFTEN_REPLACEMENTS: [
    [/\bvocê deve\b/gi, "o documento indica que"] as const,
    [/\bvocê tem que\b/gi, "o documento menciona que"] as const,
    [/\btem que\b/gi, "o documento menciona que"] as const,
    [/\bobrigatório\b/gi, "mencionado como necessário"] as const,
    [/\bprocure imediatamente\b/gi, "pode ser útil buscar orientação adequada"] as const,
  ],
  LOW_CONFIDENCE_NOTICE_PREFIX: "A imagem parece estar pouco legível, então a explicação pode estar incompleta. ",
};

// === RESPOSTAS MOCK ===
export const MOCK_RESPONSES = {
  ANALYZE: {
    confidence: 0.82,
    cards: [
      { id: "whatIs", title: POSTPROCESS_TEXTS.CARD_TITLES.whatIs, text: "Documento de teste." },
      { id: "whatSays", title: "O que diz", text: "Conteúdo simulado para testes." },
      { id: "dates", title: "Datas", text: "Sem datas relevantes." },
      { id: "terms", title: "Termos", text: "Sem termos complexos." },
      { id: "whatUsuallyHappens", title: "O que acontece", text: "Nada a destacar." },
    ],
    notice: "Resposta simulada para testes.",
  },
  OCR: { documentText: "Texto simulado para OCR." },
  ANSWER: "Resposta simulada para perguntas.",
};

// === MENSAGENS DE ERRO DA API ===
export const API_ERROR_MESSAGES = {
  SESSION_EXPIRED_ANALYZE: SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_CAPTURE: SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_FEEDBACK: SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_QA: SESSION_EXPIRED_MESSAGE,
  INVALID_REQUEST: "Requisicao invalida.",
  IMAGE_NOT_FOUND: IMAGE_NOT_FOUND_MESSAGE,
  MODEL_INVALID_JSON: MODEL_INVALID_JSON_MESSAGE,
  INTERNAL_ERROR_ANALYZE: getInternalErrorMessage("analisar documento"),
  BASE64_INVALID: "Base64 invalido.",
  IMAGE_INVALID: IMAGE_INVALID_MESSAGE,
  IMAGE_TOO_LARGE: IMAGE_TOO_LARGE_MESSAGE,
  IMAGE_TYPE_UNSUPPORTED: IMAGE_TYPE_UNSUPPORTED_MESSAGE,
  IMAGE_TYPE_INVALID: "Tipo de imagem invalido.",
  IMAGE_NOT_PROVIDED: IMAGE_NOT_PROVIDED_MESSAGE,
  OCR_DATA_URL_INVALID: "OCR data URL invalida.",
  SYSTEM_BUSY: SYSTEM_BUSY_MESSAGE,
  SYSTEM_FULL: SYSTEM_FULL_MESSAGE,
  INTERNAL_ERROR_CAPTURE: getInternalErrorMessage("receber imagem"),
  FEEDBACK_INVALID: "Feedback inválido",
  INTERNAL_ERROR_FEEDBACK: getInternalErrorMessage("registrar feedback"),
  CAPTURE_ID_MISSING: "CaptureId nao informado.",
  INTERNAL_ERROR_OCR: getInternalErrorMessage("extrair texto"),
  QUESTION_TOO_SHORT: QUESTION_TOO_SHORT_MESSAGE,
  QUESTION_TOO_LONG: QUESTION_TOO_LONG_MESSAGE,
  CONTEXT_MISSING: CONTEXT_MISSING_MESSAGE,
  CONTEXT_TOO_LONG: CONTEXT_TOO_LONG_MESSAGE,
  MODEL_NO_TEXT: MODEL_NO_TEXT_MESSAGE,
  INTERNAL_ERROR_QA: getInternalErrorMessage("responder pergunta"),
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