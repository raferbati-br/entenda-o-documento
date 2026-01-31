const KEY = "eod_result_v2";

export type Card = {
  id: string;
  title: string;
  text: string;
};

export type AnalysisResult = {
  confidence: number; // 0..1
  cards: Card[];
  notice: string;
};

export function saveResult(payload: AnalysisResult) {
  if (typeof globalThis.window === "undefined") return;
  globalThis.sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadResult(): AnalysisResult | null {
  if (typeof globalThis.window === "undefined") return null;

  const raw = globalThis.sessionStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AnalysisResult;

    // Validação mínima para evitar quebrar a UI se algo inválido cair no storage
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

export function clearResult() {
  if (typeof globalThis.window === "undefined") return;
  globalThis.sessionStorage.removeItem(KEY);
}
