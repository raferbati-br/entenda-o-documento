/**
 * Avaliação da qualidade do texto extraído por OCR.
 * Verifica comprimento e proporção de letras para determinar se é suficiente.
 */

type OcrTextQuality = {
  ok: boolean; // Se atende critérios
  length: number; // Comprimento do texto
  alphaRatio: number; // Proporção de letras
  minChars: number; // Mínimo de caracteres
  minAlphaRatio: number; // Mínima proporção de letras
};

// Parseia mínimo de caracteres de env
function parseMinChars(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

// Parseia mínima proporção de letras de env
function parseMinAlphaRatio(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

// Normaliza texto removendo espaços extras
function normalizeText(text: string) {
  return (text || "").replaceAll(/\s+/g, " ").trim();
}

// Avalia qualidade do texto OCR
export function evaluateOcrText(
  text: string,
  overrides?: { minChars?: number; minAlphaRatio?: number }
): OcrTextQuality {
  const minChars = overrides?.minChars ?? parseMinChars(process.env.ANALYZE_OCR_MIN_CHARS, 200);
  const minAlphaRatio =
    overrides?.minAlphaRatio ?? parseMinAlphaRatio(process.env.ANALYZE_OCR_MIN_ALPHA_RATIO, 0.3);
  const normalized = normalizeText(text);
  const length = normalized.length;
  const letters = normalized.match(/[A-Za-zÀ-ÿ]/g)?.length ?? 0;
  const alphaRatio = length ? letters / length : 0;
  const ok = length >= minChars && alphaRatio >= minAlphaRatio;

  return {
    ok,
    length,
    alphaRatio,
    minChars,
    minAlphaRatio,
  };
}

// Verifica se texto OCR é suficiente
export function isOcrTextSufficient(text: string, overrides?: { minChars?: number; minAlphaRatio?: number }) {
  return evaluateOcrText(text, overrides).ok;
}
