type OcrTextQuality = {
  ok: boolean;
  length: number;
  alphaRatio: number;
  minChars: number;
  minAlphaRatio: number;
};

function parseMinChars(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseMinAlphaRatio(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

function normalizeText(text: string) {
  return (text || "").replaceAll(/\s+/g, " ").trim();
}

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

export function isOcrTextSufficient(text: string, overrides?: { minChars?: number; minAlphaRatio?: number }) {
  return evaluateOcrText(text, overrides).ok;
}
