/**
 * Armazenamento de resultados de análise no sessionStorage do navegador.
 * Persiste dados de análise entre navegações na mesma aba.
 */

const KEY = "eod_result_v2";

export type Card = {
  id: string;
  title: string;
  text: string;
};

export type AnalysisResult = {
  confidence: number; // Confiança 0..1
  cards: Card[]; // Lista de cards
  notice: string; // Aviso adicional
};

// Salva resultado no sessionStorage
export function saveResult(payload: AnalysisResult) {
  if (globalThis.window === undefined) return;
  globalThis.sessionStorage.setItem(KEY, JSON.stringify(payload));
}

// Carrega resultado do sessionStorage
export function loadResult(): AnalysisResult | null {
  if (globalThis.window === undefined) return null;

  const raw = globalThis.sessionStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AnalysisResult;

    // Validação para evitar dados inválidos
    if (
      typeof parsed?.confidence !== "number" ||
      !Array.isArray(parsed?.cards) ||
      typeof parsed?.notice !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

// Limpa resultado do sessionStorage
export function clearResult() {
  if (globalThis.window === undefined) return;
  globalThis.sessionStorage.removeItem(KEY);
}
