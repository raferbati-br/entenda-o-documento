/**
 * Armazenamento de contexto para perguntas e respostas em memória.
 * Mantém o texto do documento para sessões de QA.
 */

let qaContext: string | null = null;

// Salva contexto QA
export function saveQaContext(text: string) {
  qaContext = text;
}

// Carrega contexto QA
export function loadQaContext() {
  return qaContext;
}

// Limpa contexto QA
export function clearQaContext() {
  qaContext = null;
}
